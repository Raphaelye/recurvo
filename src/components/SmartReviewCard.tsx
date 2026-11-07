import { SparkleIcon } from "@hugeicons/core-free-icons";
import { Pressable, Text, View } from "react-native";

import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";
import type { SmartReview } from "@/types/insights";

type SmartReviewCardProps = {
  review: SmartReview;
  // The open card is lighter and shows Keep and Cancel. One is open at a time.
  open: boolean;
  onOpen: () => void;
  onKeep: () => void;
  onCancel: () => void;
};

// One Smart Review on Insights: sparkle, title and message. Tapping a closed card opens it.
export function SmartReviewCard({ review, open, onOpen, onKeep, onCancel }: SmartReviewCardProps) {
  return (
    <Pressable
      // While open, Keep and Cancel need to be reachable on their own by screen readers.
      accessible={!open}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      disabled={open}
      onPress={onOpen}
      className={cn("rounded-xl px-4 py-3.5", open ? "bg-foreground" : "bg-card active:opacity-90")}
    >
      <View className="flex-row items-start gap-3">
        <View className="icon-circle size-10">
          <Icon icon={SparkleIcon} size={20} className="text-content" />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] leading-[21px] font-semibold text-content">
            {review.title}
          </Text>
          <Text className="mt-0.5 text-[13px] leading-[19px] font-normal text-soft">
            {review.message}
          </Text>
        </View>
      </View>

      {open && (
        <View className="mt-3 flex-row">
          <Pressable
            accessibilityRole="button"
            onPress={onKeep}
            className="min-h-11 flex-1 items-center justify-center active:opacity-70"
          >
            <Text className="text-[15px] leading-[20px] font-semibold text-content">Keep</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onCancel}
            className="min-h-11 flex-1 items-center justify-center active:opacity-70"
          >
            <Text className="text-[15px] leading-[20px] font-semibold text-destructive">
              Cancel
            </Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}
