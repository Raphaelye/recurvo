import type { IconSvgElement } from "@hugeicons/react-native";
import { Text, View } from "react-native";

import { Icon } from "@/components/Icon";

type InsightStatCardProps = {
  // Shown in capitals, e.g. "Monthly".
  label: string;
  icon: IconSvgElement;
  // Formatted in the preferred currency.
  amount: string;
  caption: string;
};

// One of the two figures at the top of Insights (Monthly, Yearly).
export function InsightStatCard({ label, icon, amount, caption }: InsightStatCardProps) {
  return (
    <View className="flex-1 rounded-lg bg-card pb-3.5 pl-4 pr-5 pt-4">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-[11px] leading-[16px] font-normal uppercase text-muted">{label}</Text>
        <Icon icon={icon} size={20} className="text-accent" />
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        className="mt-3 text-[20px] leading-[28px] font-bold text-content"
      >
        {amount}
      </Text>
      <Text numberOfLines={1} className="text-[11px] leading-[14px] font-normal text-soft">
        {caption}
      </Text>
    </View>
  );
}
