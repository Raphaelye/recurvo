// Clerk calls this when a user is deleted, including from the Clerk dashboard,
// and it deletes everything Supabase holds for them. The app already deletes
// these rows itself before it deletes an account (lib/accountRepository.ts); this
// covers every other way, and running twice is harmless.
//
// Clerk signs each delivery (Svix). verifyWebhook checks it with the endpoint's
// signing secret, so only Clerk can trigger a deletion. There is no user session,
// so verify_jwt is off for this function in config.toml.

import { verifyWebhook } from "@clerk/backend/webhooks";
import { createClient } from "@supabase/supabase-js";

// Every table with a user_id. The service role skips RLS.
const userTables = [
  "subscriptions",
  "preferences",
  "kept_reviews",
  "push_tokens",
  "statement_scans",
] as const;

function adminClient() {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  const secretKey = secretKeys
    ? (JSON.parse(secretKeys) as Record<string, string>).default
    : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(Deno.env.get("SUPABASE_URL") ?? "", secretKey ?? "", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let event;
  try {
    event = await verifyWebhook(request, {
      signingSecret: Deno.env.get("CLERK_WEBHOOK_SIGNING_SECRET"),
    });
  } catch {
    console.error("Webhook verification failed");
    return new Response("Verification failed", { status: 400 });
  }

  // Only deletions matter. Anything else is acknowledged so Clerk doesn't retry.
  if (event.type !== "user.deleted") {
    return new Response("Ignored", { status: 200 });
  }
  const userId = event.data.id;
  if (!userId) {
    return new Response("No user id", { status: 200 });
  }

  const db = adminClient();
  const results = await Promise.all(
    userTables.map((table) => db.from(table).delete().eq("user_id", userId)),
  );
  const failed = results.filter((result) => result.error).length;
  if (failed > 0) {
    // A 500 makes Clerk retry later. Only the count is logged, never data.
    console.error("Deleting user rows failed in", failed, "tables");
    return new Response("Delete failed", { status: 500 });
  }
  return new Response("Deleted", { status: 200 });
});
