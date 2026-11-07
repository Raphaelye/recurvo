import { Pressable, Text, View } from "react-native";

import { SubscriptionLogo } from "@/components/SubscriptionLogo";
import type { SubscriptionListItem } from "@/types/subscription";

type SubscriptionRowProps = {
  subscription: SubscriptionListItem;
  onPress: () => void;
};

// One tracked subscription: logo, name and category, then the amount and cycle.
export function SubscriptionRow({ subscription, onPress }: SubscriptionRowProps) {
  const { name, category, amount, cycle } = subscription;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-2 rounded-md bg-card py-3 pl-4.5 pr-5 active:opacity-90"
    >
      <SubscriptionLogo name={name} />
      <View className="flex-1">
        <Text numberOfLines={1} className="text-[20px] leading-[26px] font-semibold text-content">
          {name}
        </Text>
        <Text numberOfLines={1} className="text-[13px] leading-[19px] font-normal text-muted">
          {category}
        </Text>
      </View>
      <View className="items-end pt-1">
        <Text className="text-[16px] leading-[22px] font-semibold text-content">{amount}</Text>
        <Text className="text-[13px] leading-[19px] font-normal text-muted">{cycle}</Text>
      </View>
    </Pressable>
  );
}
