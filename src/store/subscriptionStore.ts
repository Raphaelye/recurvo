import { create } from "zustand";

import {
  addSubscriptions,
  loadSubscriptions,
  removeSubscription,
  updateSubscription,
} from "@/lib/subscriptionRepository";
import type { SubscriptionChanges, TrackedSubscription } from "@/types/subscription";

type SubscriptionState = {
  // The signed-in account the list belongs to. Undefined when signed out.
  userId?: string;
  // Every tracked subscription of that account, across all cards.
  subscriptions: TrackedSubscription[];
  // Loads an account's list. The root layout calls it whenever the signed-in account changes.
  hydrate: (userId: string | undefined) => Promise<void>;
  // Saves the subscriptions confirmed for one card.
  add: (subscriptions: TrackedSubscription[]) => Promise<void>;
  // Edits one subscription, e.g. its card, or cancels it with cancelledAt.
  update: (id: string, changes: SubscriptionChanges) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

// Each save reads the saved list, changes it and writes it back. Running them one
// after another means two quick changes (stop tracking, then its reminder) never
// both start from the same old list.
let saving: Promise<unknown> = Promise.resolve();
function inTurn<T>(task: () => Promise<T>) {
  const next = saving.then(task, task);
  saving = next.catch(() => {});
  return next;
}

// Saving only happens on signed-in screens, so the actions below always have a userId.
export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: [],

  hydrate: async (userId) => {
    // Emptied straight away, so the next account never sees the last one's list.
    set({ userId, subscriptions: [] });
    if (!userId) {
      return;
    }
    const subscriptions = await loadSubscriptions(userId);
    // Another sign-in may have replaced this account while it was loading.
    if (get().userId === userId) {
      set({ subscriptions });
    }
  },
  add: (subscriptions) =>
    inTurn(async () => {
      const { userId } = get();
      if (userId) {
        set({ subscriptions: await addSubscriptions(userId, subscriptions) });
      }
    }),
  update: (id, changes) =>
    inTurn(async () => {
      const { userId } = get();
      if (userId) {
        set({ subscriptions: await updateSubscription(userId, id, changes) });
      }
    }),
  remove: (id) =>
    inTurn(async () => {
      const { userId } = get();
      if (userId) {
        set({ subscriptions: await removeSubscription(userId, id) });
      }
    }),
}));
