import { create } from "zustand";

import {
  fetchKeptReviews,
  loadKeptReviewsCopy,
  saveKeptReview,
  saveKeptReviewsCopy,
} from "@/lib/reviewRepository";
import { alertSaveFailed, createSaveQueue } from "@/lib/saveQueue";

type ReviewState = {
  // The signed-in account the list belongs to. Undefined when signed out.
  userId?: string;
  // Ids of the Smart Reviews answered with "Keep". They stay hidden.
  kept: string[];
  // Loads an account's list. The root layout calls it whenever the signed-in account changes.
  hydrate: (userId: string | undefined) => Promise<void>;
  // Loads the list from Supabase again, e.g. when the app comes back to the foreground.
  refresh: () => Promise<void>;
  // Hides the review straight away. Resolves true once Supabase has saved it.
  keep: (id: string) => Promise<boolean>;
};

let saves = createSaveQueue();

export const useReviewStore = create<ReviewState>((set, get) => ({
  kept: [],

  hydrate: async (userId) => {
    // Emptied straight away, so the next account never sees the last one's list.
    set({ userId, kept: [] });
    saves = createSaveQueue();
    if (!userId) {
      return;
    }
    const copy = await loadKeptReviewsCopy(userId);
    // Another sign-in may have replaced this account while it was loading.
    if (get().userId !== userId) {
      return;
    }
    if (copy) {
      set({ kept: copy });
      get().refresh();
      return;
    }
    await get().refresh();
  },
  refresh: async () => {
    const { userId } = get();
    if (!userId) {
      return;
    }
    const queue = saves;
    const start = queue.version();
    let kept: string[];
    try {
      kept = await fetchKeptReviews(userId);
    } catch {
      // Offline or Supabase is unreachable: the copy stays.
      return;
    }
    if (get().userId !== userId || !queue.quietSince(start)) {
      return;
    }
    set({ kept });
    saveKeptReviewsCopy(userId, kept);
  },
  // If Supabase can't save it, the review shows again and the user is told.
  keep: (id) => {
    const { userId } = get();
    if (!userId) {
      return Promise.resolve(false);
    }
    return saves.run(async () => {
      if (get().userId !== userId) {
        return false;
      }
      const before = get().kept;
      set({ kept: [...before, id] });
      try {
        await saveKeptReview(userId, id);
      } catch {
        if (get().userId === userId) {
          set({ kept: before });
        }
        alertSaveFailed();
        return false;
      }
      if (get().userId === userId) {
        saveKeptReviewsCopy(userId, get().kept);
      }
      return true;
    });
  },
}));
