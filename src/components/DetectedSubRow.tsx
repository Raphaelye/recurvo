import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";

import { AccentTint } from "@/components/AccentTint";
import { CheckCircle } from "@/components/CheckCircle";
import { Icon } from "@/components/Icon";
import { formatShortDate } from "@/lib/billing";
import { formatAmount } from "@/lib/currency";
import type { ReviewItem } from "@/types/setup";

type DetectedSubRowProps = {
  item: ReviewItem;
  currencySymbol: string;
  onToggle: () => void;
  onPressCycle: () => void;
};

// One result on the "We found N subscriptions" screen. Rows without a billing
// cycle highlight the "Set cycle" chip.
export function DetectedSubRow({ item, currencySymbol, onToggle, onPressCycle }: DetectedSubRowProps) {
  const { name, amount, cycle, nextRenewal, seenCount, note, possible, tracked } = item;
  const detail = possible
    ? "Possible subscription"
    : `Next ${formatShortDate(nextRenewal)} · ${note ?? `seen ${seenCount}×`}`;

  const toggle = () => {
    Haptics.selectionAsync();
    onToggle();
  };

  return (
    <View className="flex-row items-center gap-3 rounded-xl bg-foreground p-3.5">
      <View className="size-11 items-center justify-center rounded-md bg-card">
        <Text className="text-[16px] leading-[24px] font-semibold text-content">
          {name[0]?.toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className="text-[16px] leading-[24px] font-semibold text-content">
          {name}
        </Text>
        <Text numberOfLines={1} className="text-[13px] leading-[19px] font-normal text-muted">
          {detail}
        </Text>
      </View>
      <View className="items-end gap-1">
        <Text className="text-[16px] leading-[22px] font-bold text-content">
          {formatAmount(amount, currencySymbol)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${name} billing cycle: ${cycle ?? "not set"}`}
          hitSlop={11}
          onPress={onPressCycle}
          className="active:opacity-90"
        >
          {cycle ? (
            <View className="flex-row items-center gap-1 rounded-full bg-card px-2.5 py-0.5">
              <Text className="text-[13px] leading-[19px] font-medium text-muted">{cycle}</Text>
              <Icon icon={ArrowDown01Icon} size={12} className="text-muted" />
            </View>
          ) : (
            <AccentTint className="flex-row gap-1 rounded-full px-2.5 py-0.5">
              <Text className="text-[13px] leading-[19px] font-medium text-accent-text">
                Set cycle
              </Text>
              <Icon icon={ArrowDown01Icon} size={12} className="text-accent-text" />
            </AccentTint>
          )}
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`Track ${name}`}
        accessibilityState={{ checked: tracked }}
        hitSlop={9}
        onPress={toggle}
      >
        {tracked ? (
          <CheckCircle className="size-[26px]" />
        ) : (
          <View className="size-[26px] rounded-full border-2 border-neutral" />
        )}
      </Pressable>
    </View>
  );
}
