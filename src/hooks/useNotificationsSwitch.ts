import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { AppState, Linking } from "react-native";

import type { PermissionSheetMode } from "@/components/NotificationPermissionSheet";
import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermission,
} from "@/lib/notifications";
import { track } from "@/lib/posthog";
import { usePreferencesStore } from "@/store/preferencesStore";

// Turns the account's notifications on or off (Settings' switch, the Notifications
// page's empty state). They are on when the account wants them and the phone
// allows them. Turning them on without permission opens the permission sheet,
// which explains why and then asks, or sends the user to the phone's Settings
// once the app can't ask.
export function useNotificationsSwitch() {
  const enabled = usePreferencesStore((state) => state.notifications.enabled);
  const setNotifications = usePreferencesStore((state) => state.setNotifications);
  // Undefined until the phone's permission has been read.
  const [permission, setPermission] = useState<NotificationPermission>();
  const [sheetOpen, setSheetOpen] = useState(false);
  // Kept after the sheet closes, so its text does not change while it slides out.
  const [mode, setMode] = useState<PermissionSheetMode>("ask");
  // True while the sheet asks. Settings holds its switch on meanwhile.
  const [asking, setAsking] = useState(false);

  // Read again on every visit and on coming back from the phone's Settings.
  useFocusEffect(
    useCallback(() => {
      getNotificationPermission().then(setPermission);
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          getNotificationPermission().then(setPermission);
        }
      });
      return () => subscription.remove();
    }, []),
  );

  const turnOn = () => {
    setNotifications({ enabled: true });
    track("notifications_changed", { enabled: true });
  };

  const change = async (next: boolean) => {
    if (!next) {
      setNotifications({ enabled: false });
      track("notifications_changed", { enabled: false });
      return;
    }
    const current = await getNotificationPermission();
    setPermission(current);
    if (current === "granted") {
      turnOn();
      return;
    }
    setAsking(true);
    setMode(current === "denied" ? "settings" : "ask");
    setSheetOpen(true);
  };

  const cancel = () => {
    setSheetOpen(false);
    setAsking(false);
  };

  const confirm = async () => {
    setSheetOpen(false);
    if (mode === "settings") {
      // Notifications count as on by themselves once permission is given there.
      turnOn();
      setAsking(false);
      Linking.openSettings();
      return;
    }
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") {
      turnOn();
    }
    setAsking(false);
  };

  return {
    permission,
    on: enabled && permission === "granted",
    asking,
    change,
    // Props for NotificationPermissionSheet.
    sheet: { visible: sheetOpen, mode, onConfirm: confirm, onClose: cancel },
  };
}
