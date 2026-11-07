import {
  AndroidImportance,
  getPermissionsAsync,
  IosAuthorizationStatus,
  requestPermissionsAsync,
  setNotificationChannelAsync,
  type NotificationPermissionsStatus,
} from "expo-notifications";
import { Platform } from "react-native";

import type { NotificationData } from "@/types/notifications";

// Notification permission for subscription reminders. Reminders and AI reviews are
// sent by scheduled Supabase functions, never from the app. Saving this device's
// push token comes with that feature.

// After stopping tracking, the reminder to cancel with the provider comes this
// many days before the next charge.
export const CANCEL_REMINDER_DAYS = 2;

// "undetermined": the app can still show the system prompt.
// "denied": only the phone's Settings can turn notifications on.
export type NotificationPermission = "granted" | "undetermined" | "denied";

function toPermission(settings: NotificationPermissionsStatus): NotificationPermission {
  if (settings.granted || settings.ios?.status === IosAuthorizationStatus.PROVISIONAL) {
    return "granted";
  }
  // Android can ask again after a first "Don't allow".
  return settings.canAskAgain ? "undetermined" : "denied";
}

export async function getNotificationPermission() {
  return toPermission(await getPermissionsAsync());
}

export async function requestNotificationPermission() {
  // Android 13 and later only show the prompt once the app has a channel.
  if (Platform.OS === "android") {
    await setNotificationChannelAsync("reminders", {
      name: "Renewal reminders",
      importance: AndroidImportance.DEFAULT,
    });
  }
  return toPermission(await requestPermissionsAsync());
}

// The push's data as NotificationData, or undefined when it doesn't match, so a
// push from an older or newer version of the Supabase function can't open a wrong screen.
export function readNotificationData(
  data: Record<string, unknown> | undefined,
): NotificationData | undefined {
  const type = data?.type;
  if (type === "review") {
    return { type };
  }
  const subscriptionId = data?.subscriptionId;
  if ((type === "renewal" || type === "cancel") && typeof subscriptionId === "string") {
    return { type, subscriptionId };
  }
  return undefined;
}
