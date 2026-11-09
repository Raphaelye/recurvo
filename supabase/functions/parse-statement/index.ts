// Reads a bank statement for the app (lib/statementParser.ts):
// - mode "card": the card on it, when the file is picked.
// - mode "scan": the card, the account's currency and the recurring charges.
//
// The statement only lives in this request's memory. It is never stored or
// logged, and it is gone when the response is sent (AGENTS.md, Data and Privacy).
//
// The request is multipart form data: mode, bank and file. The caller must send
// a Clerk session token, which is verified here (verify_jwt is off for this
// function in config.toml, because the gateway only accepts Supabase's own).

import { createClient } from "@supabase/supabase-js";
import { createRemoteJWKSet, jwtVerify } from "jose";

import { readStatement, StatementError, type StatementFile } from "./statement.ts";

// Same as MAX_STATEMENT_BYTES in the app (data/setup.ts).
const MAX_BYTES = 10 * 1024 * 1024;
// Card reads and scans together, per account, in 24 hours.
const DAILY_LIMIT = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

// Clerk's Frontend API URL, e.g. https://example.clerk.accounts.dev. Tokens are
// checked against its public keys.
const clerkIssuer = Deno.env.get("CLERK_ISSUER")?.replace(/\/+$/, "");
const clerkKeys = clerkIssuer
  ? createRemoteJWKSet(new URL(`${clerkIssuer}/.well-known/jwks.json`))
  : undefined;

// Errors only carry a code, which the app turns into a message.
function fail(code: string, status: number) {
  return Response.json({ error: code }, { status });
}

// The Clerk user id of a valid session token, or undefined.
async function verifyUser(request: Request) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !clerkIssuer || !clerkKeys) {
    if (!clerkIssuer) {
      console.error("CLERK_ISSUER is not set");
    }
    return undefined;
  }
  try {
    // Clerk session tokens live about a minute, so a few seconds of clock skew matter.
    const { payload } = await jwtVerify(token, clerkKeys, { issuer: clerkIssuer, clockTolerance: 5 });
    return typeof payload.sub === "string" && payload.sub ? payload.sub : undefined;
  } catch {
    return undefined;
  }
}

// The service role skips RLS. Only used for statement_scans, which the app can't reach.
function adminClient() {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  const secretKey = secretKeys
    ? (JSON.parse(secretKeys) as Record<string, string>).default
    : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(Deno.env.get("SUPABASE_URL") ?? "", secretKey ?? "", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Counts this request towards the account's daily limit. True when the limit
// was already reached, so the request is refused.
async function overDailyLimit(userId: string) {
  const db = adminClient();
  const since = new Date(Date.now() - DAY_MS).toISOString();
  // Rows older than a day no longer count.
  await db.from("statement_scans").delete().eq("user_id", userId).lt("created_at", since);
  const { count, error } = await db
    .from("statement_scans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if (error) {
    throw error;
  }
  if ((count ?? 0) >= DAILY_LIMIT) {
    return true;
  }
  const { error: insertError } = await db.from("statement_scans").insert({ user_id: userId });
  if (insertError) {
    throw insertError;
  }
  return false;
}

function fileKind(file: File): StatementFile["kind"] | undefined {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return "pdf";
  }
  if (file.type.includes("csv") || name.endsWith(".csv")) {
    return "csv";
  }
  return undefined;
}

// A short, single-line bank name from the app's picker.
function cleanBank(value: FormDataEntryValue | null) {
  const bank = typeof value === "string" ? value.replace(/[^\p{L}\p{N} .&'-]/gu, "").trim() : "";
  return bank.slice(0, 40) || "Other";
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return fail("method_not_allowed", 405);
  }
  const userId = await verifyUser(request);
  if (!userId) {
    return fail("unauthorized", 401);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("bad_request", 400);
  }
  const mode = form.get("mode");
  const file = form.get("file");
  if ((mode !== "card" && mode !== "scan") || !(file instanceof File)) {
    return fail("bad_request", 400);
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return fail("too_large", 413);
  }
  const kind = fileKind(file);
  if (!kind) {
    return fail("unsupported_file", 415);
  }

  try {
    if (await overDailyLimit(userId)) {
      return fail("limit", 429);
    }
  } catch {
    console.error("Daily limit check failed");
    return fail("server_error", 500);
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await readStatement(mode, { kind, bytes }, cleanBank(form.get("bank")));
    return Response.json(result);
  } catch (error) {
    if (error instanceof StatementError) {
      return fail(error.code, error.status);
    }
    console.error("Unexpected error", error instanceof Error ? error.name : "unknown");
    return fail("server_error", 500);
  }
});
