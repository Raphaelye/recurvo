import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { Pressable, Text, View } from "react-native";

import { Icon } from "@/components/Icon";
import { Illustration } from "@/components/Illustration";
import { cn } from "@/lib/cn";

type SavedBannerProps = {
  // What the cancelled subscriptions would cost each month, formatted.
  amount: string;
  onPress: () => void;
  className?: string;
};

// "You’ve saved ₦15,700" on Insights. Opens the cancelled subscriptions.
export function SavedBanner({ amount, onPress, className }: SavedBannerProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`You’ve saved ${amount} by canceling unused subscriptions`}
      accessibilityHint="Shows your cancelled subscriptions"
      onPress={onPress}
      className={cn(
        "flex-row items-center gap-2.5 rounded-sm border border-line bg-card px-5 py-4.5 active:opacity-90",
        className,
      )}
    >
      <Illustration name="piggyBank" width={46} height={48} />
      <View className="flex-1">
        <Text className="text-[16px] leading-[22px] font-semibold text-content">
          {`You’ve saved ${amount}`}
        </Text>
        <Text className="text-[13px] leading-[18px] font-normal text-muted">
          by canceling unused subscriptions
        </Text>
      </View>
      <Icon icon={ArrowRight02Icon} size={24} className="text-content" />
    </Pressable>
  );
}
