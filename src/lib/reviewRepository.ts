import { readCopy, writeCopy } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import type { ReviewBatch, ReviewKind } from "@/types/insights";

const COPY_KEY = "kept-reviews-copy";
const BATCH_COPY_KEY = "review-batch-copy";

// The Smart Reviews the account answered "Keep" to, by review id, and the latest
// AI batch the smart-reviews function saved. Rows in Supabase, with a copy on the
// phone like the subscriptions.

export function loadKeptReviewsCopy(userId: string) {
  return readCopy<string[]>(COPY_KEY, userId);
}

export function saveKeptReviewsCopy(userId: string, ids: string[]) {
  return writeCopy(COPY_KEY, userId, ids);
}

export async function fetchKeptReviews(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("kept_reviews")
    .select("review_id")
    .eq("user_id", userId)
    .order("created_at");
  if (error) {
    throw error;
  }
  return data.map((row) => row.review_id);
}

// Postgres' unique violation: the review is already kept, e.g. from another phone.
const ALREADY_SAVED = "23505";

export async function saveKeptReview(userId: string, id: string) {
  const { error } = await supabase
    .from("kept_reviews")
    .insert({ user_id: userId, review_id: id });
  if (error && error.code !== ALREADY_SAVED) {
    throw error;
  }
}

// Null: the account has no AI batch yet.
export function loadReviewBatchCopy(userId: string) {
  return readCopy<ReviewBatch | null>(BATCH_COPY_KEY, userId);
}

export function saveReviewBatchCopy(userId: string, batch: ReviewBatch | null) {
  return writeCopy(BATCH_COPY_KEY, userId, batch);
}

// The table's check only allows these.
const kinds: ReviewKind[] = ["most_expensive", "foreign_currency", "overlap", "upcoming"];

export async function fetchReviewBatch(userId: string): Promise<ReviewBatch | null> {
  const [batch, reviews] = await Promise.all([
    supabase.from("review_batches").select("currency").eq("user_id", userId).maybeSingle(),
    supabase
      .from("smart_reviews")
      .select("id, kind, subscription_id, title, message")
      .eq("user_id", userId)
      .order("position"),
  ]);
  if (batch.error || reviews.error) {
    throw batch.error ?? reviews.error;
  }
  if (!batch.data) {
    return null;
  }
  return {
    currency: batch.data.currency,
    reviews: reviews.data.flatMap((row) => {
      const kind = kinds.find((value) => value === row.kind);
      return kind
        ? [{ id: row.id, kind, subscriptionId: row.subscription_id, title: row.title, message: row.message }]
        : [];
    }),
  };
}
