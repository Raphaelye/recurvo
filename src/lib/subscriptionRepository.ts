import { readCopy, writeCopy } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import type { Tables, TablesInsert } from "@/types/database";
import type { BillingCycle, CardType } from "@/types/setup";
import type { TrackedSubscription } from "@/types/subscription";

const COPY_KEY = "subscriptions-copy";

// An account's subscriptions live in Supabase, one row each. The phone keeps a
// copy of the last list loaded, so the app opens straight away and works offline.

export function loadSubscriptionsCopy(userId: string) {
  return readCopy<TrackedSubscription[]>(COPY_KEY, userId);
}

export function saveSubscriptionsCopy(userId: string, subscriptions: TrackedSubscription[]) {
  return writeCopy(COPY_KEY, userId, subscriptions);
}

// In the order they were added, so the newest are at the end.
export async function fetchSubscriptions(userId: string): Promise<TrackedSubscription[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select()
    .eq("user_id", userId)
    .order("created_at")
    .order("id");
  if (error) {
    throw error;
  }
  return data.map(fromRow);
}

// Adds new subscriptions and saves changes to existing ones, matched by id.
export async function saveSubscriptions(userId: string, subscriptions: TrackedSubscription[]) {
  if (subscriptions.length === 0) {
    return;
  }
  const { error } = await supabase.from("subscriptions").upsert(
    subscriptions.map((subscription) => toRow(userId, subscription)),
    { onConflict: "user_id,id" },
  );
  if (error) {
    throw error;
  }
}

export async function deleteSubscription(userId: string, id: string) {
  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  if (error) {
    throw error;
  }
}

// Postgres sends dates as "2026-11-12T09:00:00+00:00". The app keeps JavaScript's
// ISO format, as it always has.
function isoDate(value: string) {
  return new Date(value).toISOString();
}

function fromRow(row: Tables<"subscriptions">): TrackedSubscription {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    currency: row.currency,
    // The table's checks only allow the app's own values.
    cycle: row.cycle as BillingCycle,
    nextRenewal: isoDate(row.next_renewal),
    card: { name: row.card_name, last4: row.card_last4, type: row.card_type as CardType },
    remind: row.remind,
    cancelledAt: row.cancelled_at ? isoDate(row.cancelled_at) : undefined,
    cancelReminder: row.cancel_reminder,
    addedAt: row.added_at ? isoDate(row.added_at) : undefined,
    startRate:
      row.start_rate_currency && row.start_rate !== null
        ? { currency: row.start_rate_currency, rate: row.start_rate }
        : undefined,
  };
}

// Every column is sent, so a field the app removed (set to undefined) is cleared.
function toRow(userId: string, subscription: TrackedSubscription): TablesInsert<"subscriptions"> {
  return {
    user_id: userId,
    id: subscription.id,
    name: subscription.name,
    amount: subscription.amount,
    currency: subscription.currency,
    cycle: subscription.cycle,
    next_renewal: subscription.nextRenewal,
    card_name: subscription.card.name,
    card_last4: subscription.card.last4,
    card_type: subscription.card.type,
    // Statement imports don't set it and count as on.
    remind: subscription.remind ?? true,
    cancelled_at: subscription.cancelledAt ?? null,
    cancel_reminder: subscription.cancelReminder ?? false,
    added_at: subscription.addedAt ?? null,
    start_rate_currency: subscription.startRate?.currency ?? null,
    start_rate: subscription.startRate?.rate ?? null,
  };
}
