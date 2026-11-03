import { readItem, removeItem, writeItem } from "@/lib/storage";

const KEY = "pending-setup";

// The Clerk user id of an account that signed up but has not finished card
// setup yet. Kept across restarts, so the app reopens on the upload step.
export async function loadPendingSetup(): Promise<string | undefined> {
  return (await readItem(KEY)) ?? undefined;
}

export function savePendingSetup(userId: string | undefined) {
  return userId ? writeItem(KEY, userId) : removeItem(KEY);
}
