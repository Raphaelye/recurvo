// supabase-js needs a full URL implementation, which React Native doesn't have.
import "react-native-url-polyfill/auto";

import { getClerkInstance } from "@clerk/expo";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

// Both are safe in the app: the publishable key only reaches what RLS allows.
// The secret key only lives in Supabase Edge Functions.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    "Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to the .env file",
  );
}

// Clerk signs users in, so every request carries the Clerk session token and RLS
// matches rows on its user id. Without a session (signed out) requests go as anon,
// which can't reach any table. Only the repositories in lib/ use this client.
// Table types come from `npm run db:types` (types/database.ts).
export const supabase = createClient<Database>(url, publishableKey, {
  async accessToken() {
    return (await getClerkInstance().session?.getToken()) ?? null;
  },
});
