import { Pressable, Text, View } from "react-native";

import { Radio } from "@/components/Radio";
import { ThemePreview } from "@/components/ThemePreview";
import type { AppearanceOption } from "@/data/appearance";
import { cn } from "@/lib/cn";

type AppearanceOptionCardProps = {
  option: AppearanceOption;
  selected: boolean;
  onPress: () => void;
};

// One theme choice on the Appearance screen: preview, title, description, radio.
export function AppearanceOptionCard({ option, selected, onPress }: AppearanceOptionCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${option.title}. ${option.description}`}
      onPress={onPress}
      className={cn(
        "flex-row items-center gap-4 rounded-xl px-4 py-3.5",
        selected ? "bg-foreground" : "bg-card",
      )}
    >
      <ThemePreview preference={option.preference} />
      <View className="flex-1">
        <Text className="text-[16px] leading-[22px] font-semibold text-content">{option.title}</Text>
        <Text className="mt-1 text-[13px] leading-[19px] font-normal text-muted">
          {option.description}
        </Text>
      </View>
      <Radio selected={selected} />
    </Pressable>
  );
}
