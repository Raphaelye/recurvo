import { create } from "zustand";

import { alertSaveFailed, createSaveQueue } from "@/lib/saveQueue";
import {
  deleteSubscription,
  fetchSubscriptions,
  loadSubscriptionsCopy,
  saveSubscriptions,
  saveSubscriptionsCopy,
} from "@/lib/subscriptionRepository";
import type { SubscriptionChanges, TrackedSubscription } from "@/types/subscription";

type SubscriptionState = {
  // The signed-in account the list belongs to. Undefined when signed out.
  userId?: string;
  // Every tracked subscription of that account, across all cards.
  subscriptions: TrackedSubscription[];
  // Loads an account's list. The root layout calls it whenever the signed-in account changes.
  hydrate: (userId: string | undefined) => Promise<void>;
  // Loads the list from Supabase again, e.g. when the app comes back to the foreground.
  refresh: () => Promise<void>;
  // The changes below show straight away and resolve true once Supabase has saved them.
  // Saves the subscriptions confirmed for one card.
  add: (subscriptions: TrackedSubscription[]) => Promise<boolean>;
  // Edits one subscription, e.g. its card, or cancels it with cancelledAt.
  update: (id: string, changes: SubscriptionChanges) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
};

let saves = createSaveQueue();

export const useSubscriptionStore = create<SubscriptionState>((set, get) => {
  // Shows a change, then saves it. If Supabase can't save it, the list goes back
  // to how it was and the user is told.
  const change = (
    apply: (subscriptions: TrackedSubscription[]) => TrackedSubscription[],
    save: (userId: string, subscriptions: TrackedSubscription[]) => Promise<void>,
  ) => {
    const { userId } = get();
    if (!userId) {
      return Promise.resolve(false);
    }
    return saves.run(async () => {
      // Signed out while the save before it was running.
      if (get().userId !== userId) {
        return false;
      }
      const before = get().subscriptions;
      const after = apply(before);
      set({ subscriptions: after });
      try {
        await save(userId, after);
      } catch {
        if (get().userId === userId) {
          set({ subscriptions: before });
        }
        alertSaveFailed();
        return false;
      }
      if (get().userId === userId) {
        saveSubscriptionsCopy(userId, get().subscriptions);
      }
      return true;
    });
  };

  return {
    subscriptions: [],

    hydrate: async (userId) => {
      // Emptied straight away, so the next account never sees the last one's list.
      set({ userId, subscriptions: [] });
      saves = createSaveQueue();
      if (!userId) {
        return;
      }
      const copy = await loadSubscriptionsCopy(userId);
      // Another sign-in may have replaced this account while it was loading.
      if (get().userId !== userId) {
        return;
      }
      if (copy) {
        set({ subscriptions: copy });
        get().refresh();
        return;
      }
      // The first load on this phone waits for Supabase, so Home never flashes empty.
      await get().refresh();
    },
    refresh: async () => {
      const { userId } = get();
      if (!userId) {
        return;
      }
      const queue = saves;
      const start = queue.version();
      let subscriptions: TrackedSubscription[];
      try {
        subscriptions = await fetchSubscriptions(userId);
      } catch {
        // Offline or Supabase is unreachable: the copy stays on screen.
        return;
      }
      if (get().userId !== userId || !queue.quietSince(start)) {
        return;
      }
      set({ subscriptions });
      saveSubscriptionsCopy(userId, subscriptions);
    },
    add: (subscriptions) => {
      // Ids are made unique per card, so adding a second card with the same merchant keeps both.
      const added = subscriptions.map((subscription) => ({
        ...subscription,
        id: `${subscription.card.last4}-${subscription.id}`,
      }));
      const addedIds = new Set(added.map((subscription) => subscription.id));
      return change(
        // Importing a card's statement again replaces its subscriptions.
        (saved) => [...saved.filter((subscription) => !addedIds.has(subscription.id)), ...added],
        (userId) => saveSubscriptions(userId, added),
      );
    },
    update: (id, changes) =>
      change(
        (saved) =>
          saved.map((subscription) =>
            subscription.id === id ? { ...subscription, ...changes } : subscription,
          ),
        (userId, saved) =>
          saveSubscriptions(
            userId,
            saved.filter((subscription) => subscription.id === id),
          ),
      ),
    remove: (id) =>
      change(
        (saved) => saved.filter((subscription) => subscription.id !== id),
        (userId) => deleteSubscription(userId, id),
      ),
  };
});
