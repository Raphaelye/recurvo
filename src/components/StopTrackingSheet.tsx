import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { useToday } from "@/hooks/useToday";
import {
  daysUntil,
  formatShortDate,
  monthlyAmount,
  perCycle,
  upcomingRenewal,
} from "@/lib/billing";
import { convertAmount, currencySymbol, formatAmount } from "@/lib/currency";
import { track } from "@/lib/posthog";
import { providerOf } from "@/lib/services";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useRatesStore } from "@/store/ratesStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";

type StopTrackingSheetProps = {
  // Kept by the caller after the sheet closes, so its text stays while it slides out.
  subscriptionId?: string;
  visible: boolean;
  // Where it was opened, for analytics.
  source: "insights" | "details";
  onClose: () => void;
  // Called once tracking has stopped and the sheet is out of the way.
  onStopped: (id: string) => void;
};

// Confirm step before stopping tracking a subscription (the Smart Review's Cancel,
// the details modal's Cancel Subscription): what it saves, and a reminder that the
// provider still charges until it is cancelled there too.
export function StopTrackingSheet({
  subscriptionId,
  visible,
  source,
  onClose,
  onStopped,
}: StopTrackingSheetProps) {
  const subscription = useSubscriptionStore((state) =>
    state.subscriptions.find((candidate) => candidate.id === subscriptionId),
  );
  const update = useSubscriptionStore((state) => state.update);
  const preferred = usePreferencesStore((state) => state.currency);
  const rates = useRatesStore((state) => state.rates);
  const today = useToday();
  // iOS: set when Stop tracking is tapped, acted on once the sheet has closed.
  const [confirmed, setConfirmed] = useState(false);

  if (!subscription) {
    return null;
  }

  const { id, name, amount, currency, cycle, nextRenewal } = subscription;
  // In the preferred currency, or its own until rates have loaded.
  const converted = convertAmount(amount, currency, preferred.code, rates);
  const symbol = converted === undefined ? currencySymbol(currency) : preferred.symbol;
  const charge = converted ?? amount;
  // A yearly plan shows what it costs a month, the others what they cost a year.
  const other =
    cycle === "Yearly"
      ? `about ${formatAmount(monthlyAmount(charge, cycle), symbol)}\na month`
      : `about ${formatAmount(monthlyAmount(charge, cycle) * 12, symbol)}\na year`;
  const provider = providerOf(name);
  const renewal = upcomingRenewal(nextRenewal, cycle, today);
  const before =
    daysUntil(renewal, today) === 0 ? "today" : `before ${formatShortDate(renewal.toISOString())}`;

  const stop = () => {
    setConfirmed(false);
    update(id, { cancelledAt: new Date().toISOString() });
    track("subscription_cancelled", { cycle, source });
    onStopped(id);
  };

  const confirm = () => {
    onClose();
    // On iOS a screen can't open or close while the sheet is still on top of it,
    // so stopping waits for the sheet's onDismiss. Android has no onDismiss.
    if (Platform.OS === "ios") {
      setConfirmed(true);
    } else {
      stop();
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      onDismiss={() => {
        if (confirmed) {
          stop();
        }
      }}
      title={`Stop tracking ${name}?`}
    >
      {/* Centred under the title; the sheet's own subtitle is meant for one line. */}
      <Text className="mt-1 text-center text-[15px] leading-[22px] font-normal text-muted">
        We will stop projecting its renewals and take it out of your monthly spend.
      </Text>

      <View className="mt-4.5 flex-row items-center gap-3 rounded-md bg-card px-4 pb-3 pt-3.5">
        <View className="flex-1">
          <Text className="text-[12px] leading-[16px] font-normal text-muted">You will save</Text>
          <Text className="text-[20px] leading-[28px] font-bold text-content">
            {`${formatAmount(charge, symbol)} ${perCycle(cycle)}`}
          </Text>
        </View>
        <Text className="text-right text-[12px] leading-[16px] font-normal text-muted">
          {other}
        </Text>
      </View>

      <View className="mt-[15px] flex-row items-start gap-3 rounded-md bg-card p-3.5">
        <View className="size-8 items-center justify-center">
          <Icon icon={InformationCircleIcon} size={18} className="text-content" />
        </View>
        <View className="flex-1">
          <Text className="text-[14px] leading-[20px] font-semibold text-content">
            {`This does not cancel ${provider}`}
          </Text>
          <Text className="text-[13px] leading-[19px] font-normal text-soft">
            {`Cancel with ${provider} ${before}, or the next ${formatAmount(charge, symbol)} charge will still go through.`}
          </Text>
        </View>
      </View>

      <View className="mt-4 gap-3">
        <Button label="Stop tracking" onPress={confirm} destructive />
        {/* py-1 and hitSlop give the 22px line a 46px touch area. */}
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onClose}
          className="self-center py-1 active:opacity-70"
        >
          <Text className="link-neutral">Keep tracking</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
