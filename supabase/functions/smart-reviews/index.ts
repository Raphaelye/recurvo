// Sends AI Smart Reviews. pg_cron calls this every hour (migration
// 20261113144354_smart_reviews.sql). Each account whose review is due (Weekly:
// Monday, Monthly: the 1st, from 9 AM in its time zone) gets new reviews from
// OpenAI, saved in smart_reviews for Insights, and a push to the phone it signed
// in on last, when the Notifications switch is on.
//
// Only the cron job can start a run: it sends the shared secret in x-cron-secret
// (SMART_REVIEWS_CRON_SECRET). There is no user token, so verify_jwt is off in
// config.toml. Logs only carry counts, never names or amounts.
//
// For testing, a POST with { "userId": "<Clerk user id>" } and the same secret
// reviews that account straight away, whatever the day.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { fetchRates, type Rates } from "./money.ts";
import { type Review, type SubscriptionRow, writeReviews } from "./review.ts";
import { type Frequency, isDueDay, sameDay, validTimeZone } from "./schedule.ts";

// Stops starting new accounts after this long, so the run (plus up to 45s for an
// account already started) ends inside the Edge Function's 150s limit. The rest
// are reviewed next hour.
const RUN_BUDGET_MS = 80_000;
// Accounts reviewed at the same time.
const CONCURRENCY = 4;
const PAGE_SIZE = 1000;

// The Android channel the app creates for reviews (src/lib/notifications.ts).
const REVIEW_CHANNEL = "reviews";

type DueAccount = {
  userId: string;
  currency: string;
  frequency: Frequency;
  timeZone: string;
  notify: boolean;
};

type Outcome = "pushed" | "saved" | "skipped" | "failed";

function adminClient() {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  const secretKey = secretKeys
    ? (JSON.parse(secretKeys) as Record<string, string>).default
    : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(Deno.env.get("SUPABASE_URL") ?? "", secretKey ?? "", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Compares in constant time, so the secret can't be guessed from response times.
function sameSecret(given: string, expected: string) {
  const a = new TextEncoder().encode(given);
  const b = new TextEncoder().encode(expected);
  let difference = a.length ^ b.length;
  for (let index = 0; index < b.length; index += 1) {
    difference |= (a[index] ?? 0) ^ b[index];
  }
  return difference === 0;
}

function authorised(request: Request) {
  const expected = Deno.env.get("SMART_REVIEWS_CRON_SECRET");
  if (!expected) {
    console.error("SMART_REVIEWS_CRON_SECRET is not set");
    return false;
  }
  return sameSecret(request.headers.get("x-cron-secret") ?? "", expected);
}

type PreferenceRow = {
  user_id: string;
  preferred_currency: string | null;
  notifications_enabled: boolean;
  review_alerts: string;
  time_zone: string | null;
};

function toAccount(row: PreferenceRow): DueAccount | undefined {
  const frequency = row.review_alerts;
  if (!row.preferred_currency || (frequency !== "Weekly" && frequency !== "Monthly")) {
    return undefined;
  }
  return {
    userId: row.user_id,
    currency: row.preferred_currency,
    frequency,
    timeZone: validTimeZone(row.time_zone),
    notify: row.notifications_enabled,
  };
}

// Accounts with reviews on whose due day has reached 9 AM and that don't have
// today's batch yet.
async function findDueAccounts(db: SupabaseClient, now: Date) {
  const candidates: DueAccount[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await db
      .from("preferences")
      .select("user_id, preferred_currency, notifications_enabled, review_alerts, time_zone")
      .neq("review_alerts", "Off")
      .not("preferred_currency", "is", null)
      .order("user_id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      throw error;
    }
    for (const row of data as PreferenceRow[]) {
      const account = toAccount(row);
      if (account && isDueDay(account.frequency, now, account.timeZone)) {
        candidates.push(account);
      }
    }
    if (data.length < PAGE_SIZE) {
      break;
    }
  }

  const lastBatch = new Map<string, Date>();
  for (let index = 0; index < candidates.length; index += 200) {
    const ids = candidates.slice(index, index + 200).map((account) => account.userId);
    const { data, error } = await db
      .from("review_batches")
      .select("user_id, created_at")
      .in("user_id", ids);
    if (error) {
      throw error;
    }
    for (const row of data) {
      lastBatch.set(row.user_id, new Date(row.created_at));
    }
  }
  return candidates.filter((account) => {
    const last = lastBatch.get(account.userId);
    return !last || !sameDay(last, now, account.timeZone);
  });
}

async function findAccount(db: SupabaseClient, userId: string) {
  const { data, error } = await db
    .from("preferences")
    .select("user_id, preferred_currency, notifications_enabled, review_alerts, time_zone")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data ? toAccount(data as PreferenceRow) : undefined;
}

// Replaces the account's batch. The batch row is written last, so if a step
// fails the account is still due and the next hourly run tries again.
async function saveReviews(db: SupabaseClient, account: DueAccount, reviews: Review[], now: Date) {
  const { error: deleteError } = await db
    .from("smart_reviews")
    .delete()
    .eq("user_id", account.userId);
  if (deleteError) {
    throw deleteError;
  }
  if (reviews.length > 0) {
    const { error } = await db.from("smart_reviews").insert(
      reviews.map((review, position) => ({
        user_id: account.userId,
        id: review.id,
        subscription_id: review.subscriptionId,
        kind: review.kind,
        title: review.title,
        message: review.message,
        position,
        created_at: now.toISOString(),
      })),
    );
    if (error) {
      throw error;
    }
  }
  const { error } = await db.from("review_batches").upsert({
    user_id: account.userId,
    currency: account.currency,
    created_at: now.toISOString(),
  });
  if (error) {
    throw error;
  }
}

// The account's push tokens, minus those another account signed in with later
// on the same phone ("newest sign-in wins").
async function tokensFor(db: SupabaseClient, userId: string) {
  const { data: own, error } = await db.from("push_tokens").select("token").eq("user_id", userId);
  if (error) {
    throw error;
  }
  if (own.length === 0) {
    return [];
  }
  const { data: rows, error: rowsError } = await db
    .from("push_tokens")
    .select("user_id, token")
    .in("token", own.map((row) => row.token))
    .order("updated_at", { ascending: false });
  if (rowsError) {
    throw rowsError;
  }
  const newest = new Map<string, string>();
  for (const row of rows) {
    if (!newest.has(row.token)) {
      newest.set(row.token, row.user_id);
    }
  }
  return [...newest].filter(([, owner]) => owner === userId).map(([token]) => token);
}

type PushTicket = { status: "ok" | "error"; details?: { error?: string } };

// Sends through Expo's push service. A token Expo says is no longer registered
// (the app was removed) is deleted. True when at least one push was accepted.
async function sendPush(db: SupabaseClient, account: DueAccount, review: Review) {
  const tokens = await tokensFor(db, account.userId);
  if (tokens.length === 0) {
    return false;
  }
  const accessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    signal: AbortSignal.timeout(15_000),
    body: JSON.stringify(
      tokens.map((token) => ({
        to: token,
        title: account.frequency === "Weekly" ? "Your weekly Smart Review" : "Your monthly Smart Review",
        body: review.title,
        data: { type: "review" },
        sound: "default",
        channelId: REVIEW_CHANNEL,
      })),
    ),
  });
  if (!response.ok) {
    throw new Error(`Expo push failed with ${response.status}`);
  }
  const { data: tickets = [] } = (await response.json()) as { data?: PushTicket[] };
  const gone = tokens.filter((_, index) => tickets[index]?.details?.error === "DeviceNotRegistered");
  if (gone.length > 0) {
    await db.from("push_tokens").delete().eq("user_id", account.userId).in("token", gone);
  }
  return tickets.some((ticket) => ticket.status === "ok");
}

type SubscriptionRecord = Omit<SubscriptionRow, "amount" | "start_rate"> & {
  amount: number | string;
  start_rate: number | string | null;
};

async function reviewAccount(
  db: SupabaseClient,
  account: DueAccount,
  rates: Rates,
  now: Date,
): Promise<Outcome> {
  const [subscriptions, kept] = await Promise.all([
    db
      .from("subscriptions")
      .select("id, name, amount, currency, cycle, next_renewal, added_at, start_rate_currency, start_rate")
      .eq("user_id", account.userId)
      .is("cancelled_at", null),
    db.from("kept_reviews").select("review_id").eq("user_id", account.userId),
  ]);
  if (subscriptions.error || kept.error) {
    throw subscriptions.error ?? kept.error;
  }
  // Nothing tracked: no batch is saved, so Insights keeps its own rules.
  if (subscriptions.data.length === 0) {
    return "skipped";
  }

  const reviews = await writeReviews(
    {
      currency: account.currency,
      timeZone: account.timeZone,
      subscriptions: (subscriptions.data as SubscriptionRecord[]).map((row) => ({
        ...row,
        amount: Number(row.amount),
        start_rate: row.start_rate === null ? null : Number(row.start_rate),
      })),
      kept: kept.data.map((row) => row.review_id),
    },
    rates,
    now,
  );
  await saveReviews(db, account, reviews, now);

  const first = reviews[0];
  if (!first || !account.notify) {
    return "saved";
  }
  try {
    return (await sendPush(db, account, first)) ? "pushed" : "saved";
  } catch (error) {
    // The reviews are saved, so the push isn't retried.
    console.error("Push failed", error instanceof Error ? error.message : "unknown");
    return "saved";
  }
}

async function run(userId: string | undefined) {
  const db = adminClient();
  const now = new Date();
  const started = Date.now();

  let due: DueAccount[];
  if (userId) {
    const account = await findAccount(db, userId);
    due = account ? [account] : [];
  } else {
    due = await findDueAccounts(db, now);
  }
  const counts: Record<Outcome, number> & { due: number } = {
    due: due.length,
    pushed: 0,
    saved: 0,
    skipped: 0,
    failed: 0,
  };
  if (due.length === 0) {
    return counts;
  }

  const rates = await fetchRates();
  const queue = [...due];
  const worker = async () => {
    while (queue.length > 0 && Date.now() - started < RUN_BUDGET_MS) {
      const account = queue.shift();
      if (!account) {
        return;
      }
      try {
        counts[await reviewAccount(db, account, rates, now)] += 1;
      } catch (error) {
        counts.failed += 1;
        console.error("Review failed", error instanceof Error ? error.message : "unknown");
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return counts;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!authorised(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { userId?: unknown };
  const userId = typeof body.userId === "string" && body.userId ? body.userId : undefined;
  try {
    const counts = await run(userId);
    console.log("Smart reviews", JSON.stringify(counts));
    return Response.json(counts);
  } catch (error) {
    console.error("Run failed", error instanceof Error ? error.message : "unknown");
    return new Response("Run failed", { status: 500 });
  }
});
