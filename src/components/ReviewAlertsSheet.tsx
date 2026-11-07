import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { Radio } from "@/components/Radio";
import { cn } from "@/lib/cn";
import type { ReviewFrequency } from "@/types/notifications";

const options: ReviewFrequency[] = ["Weekly", "Monthly", "Off"];

type ReviewAlertsSheetProps = {
  visible: boolean;
  value: ReviewFrequency;
  onChange: (value: ReviewFrequency) => void;
  onClose: () => void;
};

// How often the AI smart review is sent. Same rows as the currency sheet.
export function ReviewAlertsSheet({ visible, value, onChange, onClose }: ReviewAlertsSheetProps) {
  const choose = (option: ReviewFrequency) => {
    if (option !== value) {
      Haptics.selectionAsync();
      onChange(option);
    }
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Smart review alerts"
      subtitle="How often should we review your spending?"
    >
      <View className="mt-4 gap-2">
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => choose(option)}
              className={cn(
                "min-h-[52px] flex-row items-center gap-3 rounded-lg px-3 py-2.5",
                selected && "bg-card",
              )}
            >
              <Text className="flex-1 text-[16px] leading-[22px] font-semibold text-content">
                {option}
              </Text>
              <Radio selected={selected} />
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}
