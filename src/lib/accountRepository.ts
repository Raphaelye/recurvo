import { removeAllUserItems } from "@/lib/storage";

// Deletes everything this phone saved for an account: subscriptions, cards and
// preferences. Called after Clerk has deleted the account. Supabase deletes the
// server copy once it replaces this storage.
export function deleteLocalAccountData(userId: string) {
  return removeAllUserItems(userId);
}
