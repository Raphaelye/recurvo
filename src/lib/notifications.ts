import Constants from "expo-constants";
import * as Device from "expo-device";
import {
  AndroidImportance,
  getExpoPushTokenAsync,
  getPermissionsAsync,
  IosAuthorizationStatus,
  requestPermissionsAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
  type NotificationPermissionsStatus,
} from "expo-notifications";
import { Platform } from "react-native";

import { deletePushToken, savePushToken } from "@/lib/pushTokenRepository";
import type { NotificationData } from "@/types/notifications";

// Notification permission and this phone's push token. Reminders and AI reviews
// are sent by scheduled Supabase functions to the saved token, never from the app.

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

// A push that arrives while the app is open shows like it does when the app is
// closed. Called once at app start.
export function showNotificationsWhileOpen() {
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// This phone's Expo push token, or undefined when it has none: notifications not
// allowed, a simulator, or a build without push (Expo Go on Android, or before
// `eas init`, Firebase and the APNs key are set up).
async function getPushToken() {
  if (!Device.isDevice || (await getNotificationPermission()) !== "granted") {
    return undefined;
  }
  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof projectId !== "string") {
    return undefined;
  }
  try {
    return (await getExpoPushTokenAsync({ projectId })).data;
  } catch {
    return undefined;
  }
}

// The token saved this session, so sign-out can delete it without asking Expo again.
let saved: { userId: string; token: string } | undefined;

// Saves this phone's token for the signed-in account, once per session. Called
// on launch, after sign-in, when the app comes back to the foreground (e.g. from
// allowing notifications in the phone's Settings) and once notifications are
// allowed. Fails quietly: the next call tries again.
export async function registerPushToken(userId: string) {
  if (saved?.userId === userId) {
    return;
  }
  const token = await getPushToken();
  if (!token) {
    return;
  }
  try {
    await savePushToken(userId, token);
    saved = { userId, token };
  } catch {
    // Offline or Supabase is unreachable.
  }
}

// Sign-out waits this long at most for the token to be deleted.
const UNREGISTER_TIMEOUT_MS = 3000;

// Deletes this phone's token for the account before it signs out, while its
// session can still reach Supabase. A row left behind offline is never used:
// pushes only go to the account that saved the token last.
export async function unregisterPushToken(userId: string) {
  const unregister = async () => {
    const token = saved?.userId === userId ? saved.token : await getPushToken();
    if (token) {
      await deletePushToken(userId, token);
    }
    saved = undefined;
  };
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, UNREGISTER_TIMEOUT_MS));
  await Promise.race([unregister().catch(() => undefined), timeout]);
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
