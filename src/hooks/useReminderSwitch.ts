import { useAuth } from "@clerk/expo";
import { useEffect, useState } from "react";
import { Linking } from "react-native";

import type { PermissionSheetMode } from "@/components/NotificationPermissionSheet";
import {
  getNotificationPermission,
  registerPushToken,
  requestNotificationPermission,
} from "@/lib/notifications";

// A reminder switch (the Add form's Remind me, the removed screen's cancel reminder).
// It starts on only when notifications are already allowed. Switching it on without
// permission explains why first, then asks. onChange must keep the same identity.
export function useReminderSwitch(onChange: (value: boolean) => void, startOnIfAllowed: boolean) {
  const { userId } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  // Kept after the sheet closes, so its text does not change while it slides out.
  const [mode, setMode] = useState<PermissionSheetMode>("ask");

  useEffect(() => {
    if (!startOnIfAllowed) {
      return;
    }
    getNotificationPermission().then((permission) => {
      if (permission === "granted") {
        onChange(true);
      }
    });
  }, [onChange, startOnIfAllowed]);

  // The switch moves on straight away and moves back if permission is not given.
  const change = async (next: boolean) => {
    onChange(next);
    if (!next) {
      return;
    }
    const permission = await getNotificationPermission();
    if (permission !== "granted") {
      setMode(permission === "denied" ? "settings" : "ask");
      setSheetOpen(true);
    }
  };

  const cancel = () => {
    setSheetOpen(false);
    onChange(false);
  };

  const confirm = async () => {
    setSheetOpen(false);
    if (mode === "settings") {
      // Off until the user comes back and switches it on with permission.
      onChange(false);
      Linking.openSettings();
      return;
    }
    const granted = (await requestNotificationPermission()) === "granted";
    onChange(granted);
    // Reminders reach the phone through its push token.
    if (granted && userId) {
      registerPushToken(userId);
    }
  };

  return {
    change,
    // Props for NotificationPermissionSheet.
    sheet: { visible: sheetOpen, mode, onConfirm: confirm, onClose: cancel },
  };
}
