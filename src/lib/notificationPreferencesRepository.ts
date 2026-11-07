import { readUserItem, writeUserItem } from "@/lib/storage";
import type { NotificationPreferences } from "@/types/notifications";

const KEY = "notification-preferences";

export const defaultNotificationPreferences: NotificationPreferences = {
  enabled: true,
  reviewAlerts: "Weekly",
};

// Saved per account. Missing fields fall back to the defaults.
export async function loadNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const value = await readUserItem(KEY, userId);
  if (!value) {
    return defaultNotificationPreferences;
  }
  return { ...defaultNotificationPreferences, ...(JSON.parse(value) as Partial<NotificationPreferences>) };
}

export function saveNotificationPreferences(userId: string, preferences: NotificationPreferences) {
  return writeUserItem(KEY, userId, JSON.stringify(preferences));
}
