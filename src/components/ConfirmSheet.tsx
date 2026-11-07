import { Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";

type ConfirmSheetProps = {
  visible: boolean;
  title: string;
  // Restates what happens (DESIGN_SYSTEM.md section 10).
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  // iOS only: called once the sheet has fully closed.
  onDismiss?: () => void;
};

// Confirm step before a cancel or delete: a red button that does it, and "Keep it".
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
  onDismiss,
}: ConfirmSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} onDismiss={onDismiss} title={title}>
      {/* Centred under the title; the sheet's own subtitle is meant for one line. */}
      <Text className="mt-1 text-center text-[15px] leading-[22px] font-normal text-muted">
        {message}
      </Text>
      <View className="mt-6 gap-3">
        <Button label={confirmLabel} onPress={onConfirm} destructive />
        {/* py-1 and hitSlop give the 22px line a 46px touch area. */}
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onClose}
          className="self-center py-1 active:opacity-70"
        >
          <Text className="link-neutral">Keep it</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
