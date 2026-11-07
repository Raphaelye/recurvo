import { readUserItem, writeUserItem } from "@/lib/storage";

const KEY = "kept-reviews";

// The Smart Reviews the account answered "Keep" to, by review id. Saved per account.

export async function loadKeptReviews(userId: string): Promise<string[]> {
  const value = await readUserItem(KEY, userId);
  return value ? (JSON.parse(value) as string[]) : [];
}

export function saveKeptReviews(userId: string, ids: string[]) {
  return writeUserItem(KEY, userId, JSON.stringify(ids));
}
