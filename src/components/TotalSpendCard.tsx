import { AlignEndHorizontalIcon } from "@hugeicons/core-free-icons";
import { Image, Text, View } from "react-native";

import { Icon } from "@/components/Icon";
import { images } from "@/constants/images";

type TotalSpendCardProps = {
  // Already formatted in the preferred currency, e.g. ₦0.00.
  total: string;
  count: number;
};

// The card is dark in both themes: the dash image under the overlay token,
// with white (on-accent) text. The shadow sits on the outer view because
// overflow-hidden on the same view would clip it on iOS.
export function TotalSpendCard({ total, count }: TotalSpendCardProps) {
  return (
    <View className="rounded-sheet shadow-card">
      <View className="overflow-hidden rounded-sheet dark:border dark:border-line pb-6 pl-6 pr-8 pt-6">
        {/*
          size-full overrides the image's own 450x563 size, which would otherwise
          beat inset-0 and pin it to the top-left. Cover then centres it.
        */}
        <Image
          source={images.dashBg}
          resizeMode="cover"
          className="absolute w-[120%] h-[150%]"
        />
        <View className="absolute inset-0 bg-overlay" />

        

        {/* Total active subscriptions number. */}
        <View className="flex-row items-center gap-1.5 self-end">
          <Icon icon={AlignEndHorizontalIcon} size={24} className="text-accent" />
          <Text className="text-[18px] leading-[24px] font-semibold text-on-accent">{count}</Text>
        </View>
        <Text className="mt-4 text-[14px] leading-[20px] font-semibold text-neutral">
          Total Spend:
        </Text>
        <Text className="mt-1 text-[44px] leading-[52px] font-extrabold text-on-accent">
          {total}
        </Text>
      </View>
    </View>
  );
}
