import { Pressable, Text, View } from "react-native";

import { SubscriptionLogo } from "@/components/SubscriptionLogo";
import { daysFromToday, formatShortDate } from "@/lib/billing";
import { providerOf } from "@/lib/services";
import type { Reminder } from "@/types/notifications";

type NotificationCardProps = {
  reminder: Reminder;
  onPress: () => void;
};

function renewsLabel(days: number) {
  if (days === 0) {
    return "renews today";
  }
  return days === 1 ? "renews tomorrow" : `renews in ${days} days`;
}

// "Cancel DStv Compact with DStv before 28 Oct", or "Cancel Netflix today".
function cancelTitle(name: string, days: number) {
  const provider = providerOf(name);
  const withProvider = provider === name.trim() ? "" : ` with ${provider}`;
  const when = days === 0 ? "today" : `before ${formatShortDate(daysFromToday(days))}`;
  return `Cancel ${name}${withProvider} ${when}`;
}

// A reminder on the Notifications page, styled like a subscription row:
// logo, what is due, then the amount and the day.
export function NotificationCard({ reminder, onPress }: NotificationCardProps) {
  const { kind, name, amount, daysLeft, day } = reminder;
  const title =
    kind === "cancel" ? cancelTitle(name, daysLeft) : `${name} ${renewsLabel(daysLeft)}`;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center gap-2 rounded-md bg-card py-3 pl-4.5 pr-5 active:opacity-90"
    >
      <SubscriptionLogo name={name} />
      <View className="flex-1">
        <Text numberOfLines={2} className="text-[15px] leading-[20px] font-semibold text-content">
          {title}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 text-[13px] leading-[19px] font-normal text-muted">
          {`${amount} · ${day}`}
        </Text>
      </View>
    </Pressable>
  );
}
