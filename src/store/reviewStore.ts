import { create } from "zustand";

import { loadKeptReviews, saveKeptReviews } from "@/lib/reviewRepository";

type ReviewState = {
  // The signed-in account the list belongs to. Undefined when signed out.
  userId?: string;
  // Ids of the Smart Reviews answered with "Keep". They stay hidden.
  kept: string[];
  // Loads an account's list. The root layout calls it whenever the signed-in account changes.
  hydrate: (userId: string | undefined) => Promise<void>;
  keep: (id: string) => void;
};

export const useReviewStore = create<ReviewState>((set, get) => ({
  kept: [],

  hydrate: async (userId) => {
    // Emptied straight away, so the next account never sees the last one's list.
    set({ userId, kept: [] });
    if (!userId) {
      return;
    }
    const kept = await loadKeptReviews(userId);
    // Another sign-in may have replaced this account while it was loading.
    if (get().userId === userId) {
      set({ kept });
    }
  },
  keep: (id) => {
    const kept = [...get().kept, id];
    set({ kept });
    const { userId } = get();
    if (userId) {
      saveKeptReviews(userId, kept);
    }
  },
}));
