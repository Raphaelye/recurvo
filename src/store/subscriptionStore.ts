import { create } from "zustand";

import { addSubscriptions, loadSubscriptions } from "@/lib/subscriptionRepository";
import type { TrackedSubscription } from "@/types/subscription";

type SubscriptionState = {
  // Every tracked subscription, across all cards.
  subscriptions: TrackedSubscription[];
  // Loads the saved subscriptions. Called once at app start.
  hydrate: () => Promise<void>;
  // Saves the subscriptions confirmed for one card.
  add: (subscriptions: TrackedSubscription[]) => Promise<void>;
};

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  subscriptions: [],

  hydrate: async () => {
    set({ subscriptions: await loadSubscriptions() });
  },
  add: async (subscriptions) => {
    set({ subscriptions: await addSubscriptions(subscriptions) });
  },
}));
