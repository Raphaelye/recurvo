import { Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";

// "ask" explains reminders before the system prompt. "settings" is for a phone
// where notifications were turned off and the app can no longer ask.
export type PermissionSheetMode = "ask" | "settings";

const sheetText: Record<PermissionSheetMode, { title: string; message: string; button: string }> = {
  ask: {
    title: "Turn on reminders?",
    message: "We’ll notify you 3 days before each renewal so you’re never charged by surprise.",
    button: "Allow notifications",
  },
  settings: {
    title: "Notifications are off",
    message: "Turn on notifications for Recurvo in your phone’s Settings to get renewal reminders.",
    button: "Open Settings",
  },
};

type NotificationPermissionSheetProps = {
  visible: boolean;
  mode: PermissionSheetMode;
  onConfirm: () => void;
  onClose: () => void;
};

// Shown when a reminder or notifications toggle is switched on without permission.
export function NotificationPermissionSheet({
  visible,
  mode,
  onConfirm,
  onClose,
}: NotificationPermissionSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={sheetText[mode].title}>
      {/* Centred under the title; the sheet's own subtitle is meant for one line. */}
      <Text className="mt-1 text-center text-[15px] leading-[22px] font-normal text-muted">
        {sheetText[mode].message}
      </Text>
      <View className="mt-6 gap-3">
        <Button label={sheetText[mode].button} onPress={onConfirm} />
        {/* py-1 and hitSlop give the 22px line a 46px touch area. */}
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onClose}
          className="self-center py-1 active:opacity-70"
        >
          <Text className="link-neutral">Not now</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
