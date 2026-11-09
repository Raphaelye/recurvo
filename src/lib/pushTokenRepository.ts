import { supabase } from "@/lib/supabase";

// Each phone's Expo push token, a row per account in Supabase. The reminder and
// review functions send to a token only for the account that saved it last.

// Saving an existing row again moves its updated_at forward, so this account
// becomes the newest one on the phone.
export async function savePushToken(userId: string, token: string) {
  const { error } = await supabase
    .from("push_tokens")
    .upsert({ user_id: userId, token }, { onConflict: "user_id,token" });
  if (error) {
    throw error;
  }
}

export async function deletePushToken(userId: string, token: string) {
  const { error } = await supabase
    .from("push_tokens")
    .delete()
    .eq("user_id", userId)
    .eq("token", token);
  if (error) {
    throw error;
  }
}
