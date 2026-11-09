import { removeAllUserItems } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

// Deletes the account's data in Supabase: subscriptions, preferences, kept
// reviews and push tokens. Called before Clerk deletes the account, while its
// session can still reach them.
export async function deleteAccountData(userId: string) {
  const results = await Promise.all([
    supabase.from("subscriptions").delete().eq("user_id", userId),
    supabase.from("preferences").delete().eq("user_id", userId),
    supabase.from("kept_reviews").delete().eq("user_id", userId),
    supabase.from("push_tokens").delete().eq("user_id", userId),
  ]);
  const error = results.find((result) => result.error)?.error;
  if (error) {
    throw error;
  }
}

// Deletes the copy of an account's data from this phone, on sign-out and after
// the account is deleted.
export function deleteLocalAccountData(userId: string) {
  return removeAllUserItems(userId);
}
