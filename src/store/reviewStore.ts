import { create } from "zustand";

import {
  fetchKeptReviews,
  fetchReviewBatch,
  loadKeptReviewsCopy,
  loadReviewBatchCopy,
  saveKeptReview,
  saveKeptReviewsCopy,
  saveReviewBatchCopy,
} from "@/lib/reviewRepository";
import { alertSaveFailed, createSaveQueue } from "@/lib/saveQueue";
import type { ReviewBatch } from "@/types/insights";

type ReviewState = {
  // The signed-in account the list belongs to. Undefined when signed out.
  userId?: string;
  // Ids of the Smart Reviews answered with "Keep". They stay hidden.
  kept: string[];
  // The latest AI batch, or null before the first one.
  batch: ReviewBatch | null;
  // Loads an account's reviews. The root layout calls it whenever the signed-in account changes.
  hydrate: (userId: string | undefined) => Promise<void>;
  // Loads them from Supabase again, e.g. when the app comes back to the foreground
  // after a Smart Review push.
  refresh: () => Promise<void>;
  // Hides the review straight away. Resolves true once Supabase has saved it.
  keep: (id: string) => Promise<boolean>;
};

let saves = createSaveQueue();

export const useReviewStore = create<ReviewState>((set, get) => ({
  kept: [],
  batch: null,

  hydrate: async (userId) => {
    // Emptied straight away, so the next account never sees the last one's reviews.
    set({ userId, kept: [], batch: null });
    saves = createSaveQueue();
    if (!userId) {
      return;
    }
    const [copy, batchCopy] = await Promise.all([
      loadKeptReviewsCopy(userId),
      loadReviewBatchCopy(userId),
    ]);
    // Another sign-in may have replaced this account while it was loading.
    if (get().userId !== userId) {
      return;
    }
    if (copy) {
      set({ kept: copy, batch: batchCopy ?? null });
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
    // Offline or Supabase is unreachable: the copies stay.
    const [kept, batch] = await Promise.allSettled([
      fetchKeptReviews(userId),
      fetchReviewBatch(userId),
    ]);
    if (get().userId !== userId) {
      return;
    }
    if (batch.status === "fulfilled") {
      set({ batch: batch.value });
      saveReviewBatchCopy(userId, batch.value);
    }
    if (kept.status === "fulfilled" && queue.quietSince(start)) {
      set({ kept: kept.value });
      saveKeptReviewsCopy(userId, kept.value);
    }
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
