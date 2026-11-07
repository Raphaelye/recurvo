import { Pressable, Text, View } from "react-native";

import { SubscriptionLogo } from "@/components/SubscriptionLogo";
import type { SubscriptionListItem } from "@/types/subscription";

type UpcomingCardProps = {
  subscription: SubscriptionListItem;
  // Set by the screen: a card in a horizontal ScrollView can't size itself with flex.
  width: number;
  onPress: () => void;
};

function daysLeftLabel(days: number) {
  if (days === 0) {
    return "Due Today";
  }
  return days === 1 ? "1 Day Left" : `${days} Days Left`;
}

// A renewal due soon, in Home's swipeable row.
export function UpcomingCard({ subscription, width, onPress }: UpcomingCardProps) {
  const { name, amount, cycle, daysLeft } = subscription;

  return (
    // The width is calculated at runtime, which className can't express (approved 2026-11-04).
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ width }}
      className="rounded-lg bg-card pb-[15px] pl-[17px] pr-5 pt-[15px] active:opacity-90"
    >
      <View className="flex-row items-center gap-2">
        <SubscriptionLogo name={name} />
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className="text-[13px] leading-[19px] font-semibold text-content"
          >
            {amount}
          </Text>
          <Text className="text-[13px] leading-[19px] font-normal text-soft">{cycle}</Text>
        </View>
      </View>

      <Text
        numberOfLines={1}
        className="mt-2.5 text-[20px] leading-[26px] font-medium text-content"
      >
        {name}
      </Text>
      <Text className="mt-[27px] self-end text-[14px] leading-[20px] font-semibold text-destructive">
        {daysLeftLabel(daysLeft)}
      </Text>
    </Pressable>
  );
}
