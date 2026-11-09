import { readCopy, writeCopy } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

const COPY_KEY = "kept-reviews-copy";

// The Smart Reviews the account answered "Keep" to, by review id. A row each in
// Supabase, with a copy on the phone like the subscriptions.

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
