import { readItem, writeItem } from "@/lib/storage";
import type { TrackedSubscription } from "@/types/subscription";

const KEY = "subscriptions";

export async function loadSubscriptions(): Promise<TrackedSubscription[]> {
  const value = await readItem(KEY);
  return value ? (JSON.parse(value) as TrackedSubscription[]) : [];
}

// Adds the subscriptions confirmed for one card and returns the full saved list.
// Ids are made unique per card, so adding a second card with the same merchant keeps both.
export async function addSubscriptions(subscriptions: TrackedSubscription[]) {
  const saved = await loadSubscriptions();
  const added = subscriptions.map((subscription) => ({
    ...subscription,
    id: `${subscription.card.last4}-${subscription.id}`,
  }));
  const addedIds = new Set(added.map((subscription) => subscription.id));
  const kept = saved.filter((subscription) => !addedIds.has(subscription.id));
  const all = [...kept, ...added];
  await writeItem(KEY, JSON.stringify(all));
  return all;
}
