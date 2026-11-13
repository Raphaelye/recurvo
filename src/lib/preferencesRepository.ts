import { findCurrency } from "@/lib/currency";
import { readCopy, writeCopy } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import type { Currency } from "@/types/currency";
import type { NotificationPreferences, ReviewFrequency } from "@/types/notifications";

const COPY_KEY = "preferences-copy";

export const defaultNotificationPreferences: NotificationPreferences = {
  enabled: true,
  reviewAlerts: "Weekly",
};

// An account's preferences, one row in Supabase. The reminder and review
// functions read the notification settings from it.
export type SavedPreferences = {
  // Empty until picked on Create account.
  currency?: Currency;
  notifications: NotificationPreferences;
  // The phone's time zone, e.g. "Africa/Lagos", so the review push arrives at
  // 9 AM there. Only read from Supabase, not kept in the phone's copy.
  timeZone?: string;
};

// The phone's copy keeps the currency's code.
type PreferencesCopy = {
  currency?: string;
  notifications: NotificationPreferences;
};

export async function loadPreferencesCopy(userId: string): Promise<SavedPreferences | undefined> {
  const copy = await readCopy<PreferencesCopy>(COPY_KEY, userId);
  return copy && { currency: findCurrency(copy.currency), notifications: copy.notifications };
}

export function savePreferencesCopy(userId: string, preferences: SavedPreferences) {
  const copy: PreferencesCopy = {
    currency: preferences.currency?.code,
    notifications: preferences.notifications,
  };
  return writeCopy(COPY_KEY, userId, copy);
}

// An account without a row yet gets the defaults.
export async function fetchPreferences(userId: string): Promise<SavedPreferences> {
  const { data, error } = await supabase
    .from("preferences")
    .select()
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return { notifications: defaultNotificationPreferences };
  }
  return {
    currency: findCurrency(data.preferred_currency),
    notifications: {
      enabled: data.notifications_enabled,
      // The table's check only allows the app's own values.
      reviewAlerts: data.review_alerts as ReviewFrequency,
    },
    timeZone: data.time_zone ?? undefined,
  };
}

export async function saveTimeZone(userId: string, timeZone: string) {
  const { error } = await supabase
    .from("preferences")
    .upsert({ user_id: userId, time_zone: timeZone });
  if (error) {
    throw error;
  }
}

// Each save only sends its own columns, so it never overwrites the other.

export async function savePreferredCurrency(userId: string, currency: Currency) {
  const { error } = await supabase
    .from("preferences")
    .upsert({ user_id: userId, preferred_currency: currency.code });
  if (error) {
    throw error;
  }
}

export async function saveNotificationPreferences(
  userId: string,
  notifications: NotificationPreferences,
) {
  const { error } = await supabase.from("preferences").upsert({
    user_id: userId,
    notifications_enabled: notifications.enabled,
    review_alerts: notifications.reviewAlerts,
  });
  if (error) {
    throw error;
  }
}
