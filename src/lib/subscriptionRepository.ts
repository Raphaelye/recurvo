import { readUserItem, writeUserItem } from "@/lib/storage";
import type { SubscriptionChanges, TrackedSubscription } from "@/types/subscription";

const KEY = "subscriptions";

// Every function works on one account's list, saved under its Clerk user id.

export async function loadSubscriptions(userId: string): Promise<TrackedSubscription[]> {
  const value = await readUserItem(KEY, userId);
  return value ? (JSON.parse(value) as TrackedSubscription[]) : [];
}

async function saveSubscriptions(userId: string, subscriptions: TrackedSubscription[]) {
  await writeUserItem(KEY, userId, JSON.stringify(subscriptions));
  return subscriptions;
}

// Adds the subscriptions confirmed for one card and returns the full saved list.
// Ids are made unique per card, so adding a second card with the same merchant keeps both.
export async function addSubscriptions(userId: string, subscriptions: TrackedSubscription[]) {
  const saved = await loadSubscriptions(userId);
  const added = subscriptions.map((subscription) => ({
    ...subscription,
    id: `${subscription.card.last4}-${subscription.id}`,
  }));
  const addedIds = new Set(added.map((subscription) => subscription.id));
  const kept = saved.filter((subscription) => !addedIds.has(subscription.id));
  return saveSubscriptions(userId, [...kept, ...added]);
}

// Changes one saved subscription and returns the full saved list.
export async function updateSubscription(
  userId: string,
  id: string,
  changes: SubscriptionChanges,
) {
  const saved = await loadSubscriptions(userId);
  return saveSubscriptions(
    userId,
    saved.map((subscription) =>
      subscription.id === id ? { ...subscription, ...changes } : subscription,
    ),
  );
}

// Deletes one saved subscription and returns the full saved list.
export async function removeSubscription(userId: string, id: string) {
  const saved = await loadSubscriptions(userId);
  return saveSubscriptions(
    userId,
    saved.filter((subscription) => subscription.id !== id),
  );
}
