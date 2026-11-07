import { useRef } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";

type Choice = "find" | "manual";

type AddSubscriptionsSheetProps = {
  visible: boolean;
  onClose: () => void;
  // Opens the statement upload (CSV or PDF).
  onFind: () => void;
  // Opens the Add Subscription form.
  onAddManually: () => void;
};

// Opened by Home's + button: upload a statement, or add one subscription by hand.
export function AddSubscriptionsSheet({
  visible,
  onClose,
  onFind,
  onAddManually,
}: AddSubscriptionsSheetProps) {
  // On iOS the next screen opens once the sheet has fully closed, so the sheet's
  // Modal is never left on top of it.
  const pending = useRef<Choice | undefined>(undefined);

  const open = (choice: Choice) => (choice === "find" ? onFind() : onAddManually());

  const choose = (choice: Choice) => {
    onClose();
    if (Platform.OS === "ios") {
      pending.current = choice;
    } else {
      open(choice);
    }
  };

  const openPending = () => {
    if (pending.current) {
      open(pending.current);
      pending.current = undefined;
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} onDismiss={openPending} title="Add subscriptions">
      {/* Centred under the title; the sheet's own subtitle is meant for one line. */}
      <Text className="mt-1 text-center text-[15px] leading-[22px] font-normal text-muted">
        Upload a bank statement (CSV or PDF) and we’ll spot your recurring charges.
      </Text>
      <View className="mt-6 gap-3">
        <Button label="Find my subscriptions" onPress={() => choose("find")} />
        {/* py-1 and hitSlop give the 22px line a 46px touch area. */}
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => choose("manual")}
          className="self-center py-1 active:opacity-70"
        >
          <Text className="link-neutral">Add manually instead</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
