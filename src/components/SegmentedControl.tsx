import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

import { cn } from "@/lib/cn";

type SegmentedControlProps<T extends string> = {
  options: readonly T[];
  // Nothing is selected while this is undefined.
  value?: T;
  onChange: (value: T) => void;
  className?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const select = (option: T) => {
    if (option !== value) {
      Haptics.selectionAsync();
      onChange(option);
    }
  };

  return (
    <View accessibilityRole="radiogroup" className={cn("segmented", className)}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => select(option)}
            className={selected ? "segment-selected" : "segment"}
          >
            <Text
              numberOfLines={1}
              className={cn(
                "text-[14px] leading-[20px] font-semibold",
                selected ? "text-on-accent" : "text-content",
              )}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
