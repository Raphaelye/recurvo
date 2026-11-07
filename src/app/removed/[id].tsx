import { Notification01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { NotificationPermissionSheet } from "@/components/NotificationPermissionSheet";
import { Toggle } from "@/components/Toggle";
import { useReminderSwitch } from "@/hooks/useReminderSwitch";
import {
  daysFromToday,
  daysUntil,
  formatShortDate,
  monthlyAmount,
  upcomingRenewal,
} from "@/lib/billing";
import { convertAmount, currencySymbol, formatAmount } from "@/lib/currency";
import { CANCEL_REMINDER_DAYS } from "@/lib/notifications";
import { track } from "@/lib/posthog";
import { providerOf } from "@/lib/services";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useRatesStore } from "@/store/ratesStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";

function dueLabel(days: number, iso: string) {
  if (days === 0) {
    return "due today";
  }
  return days === 1 ? "due tomorrow" : `due on ${formatShortDate(iso)}`;
}

// What the screen says, read once when it opens, so Undo doesn't change the text
// while the screen fades out. The new monthly spend leaves this subscription out
// even if the store hasn't saved the stop yet.
function readSummary(id: string) {
  const { subscriptions } = useSubscriptionStore.getState();
  const { currency: preferred } = usePreferencesStore.getState();
  const { rates } = useRatesStore.getState();
  const subscription = subscriptions.find((candidate) => candidate.id === id);
  if (!subscription) {
    return undefined;
  }

  const monthlyNow = subscriptions
    .filter((candidate) => candidate.id !== id && !candidate.cancelledAt)
    .reduce((sum, candidate) => {
      const amount = convertAmount(candidate.amount, candidate.currency, preferred.code, rates);
      return amount === undefined ? sum : sum + monthlyAmount(amount, candidate.cycle);
    }, 0);

  const { name, amount, currency, cycle, nextRenewal } = subscription;
  const converted = convertAmount(amount, currency, preferred.code, rates);
  const charge =
    converted === undefined
      ? formatAmount(amount, currencySymbol(currency))
      : formatAmount(converted, preferred.symbol);
  const today = new Date();
  const renewal = upcomingRenewal(nextRenewal, cycle, today);
  const daysLeft = daysUntil(renewal, today);

  return {
    name,
    cycle,
    provider: providerOf(name),
    charge,
    due: dueLabel(daysLeft, renewal.toISOString()),
    // The reminder needs a day still to come before the charge.
    remindOn:
      daysLeft > CANCEL_REMINDER_DAYS
        ? formatShortDate(daysFromToday(daysLeft - CANCEL_REMINDER_DAYS, today))
        : undefined,
    monthlyNow: formatAmount(monthlyNow, preferred.symbol),
  };
}

// After Stop tracking: the new monthly spend, and the step left to do, cancelling
// with the provider, with an optional reminder 2 days before the next charge.
export default function Removed() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [summary] = useState(() => readSummary(id));
  const reminder = useSubscriptionStore(
    (state) => state.subscriptions.find((candidate) => candidate.id === id)?.cancelReminder,
  );
  const update = useSubscriptionStore((state) => state.update);

  const setReminder = useCallback(
    (value: boolean) => update(id, { cancelReminder: value || undefined }),
    [id, update],
  );
  // Starts on when notifications are allowed, as Remind me does.
  const { change, sheet } = useReminderSwitch(setReminder, summary?.remindOn !== undefined);

  const undo = () => {
    update(id, { cancelledAt: undefined, cancelReminder: undefined });
    if (summary) {
      track("subscription_restored", { cycle: summary.cycle, source: "undo" });
    }
    router.back();
  };

  return (
    <View className="flex-1 bg-main">
      <SafeAreaView style={styles.container}>
        {summary && (
          <View className="flex-1 justify-center px-screen">
            <View className="items-center">
              <View className="size-[72px] items-center justify-center rounded-full bg-foreground">
                <Icon icon={Tick02Icon} size={32} className="text-accent" />
              </View>
              <Text
                accessibilityRole="header"
                className="mt-5.5 text-center text-[26px] leading-[32px] font-bold text-content"
              >
                {`${summary.name} removed`}
              </Text>
              <Text className="mt-2 text-center text-[15px] leading-[22px] font-normal text-muted">
                {`Your monthly spend is now ${summary.monthlyNow}.`}
              </Text>
            </View>

            <View className="mt-3.5 rounded-xl bg-card px-4.5 pb-4 pt-[15px]">
              <Text className="text-[15px] leading-[20px] font-semibold text-content">
                {`One more step: cancel with ${summary.provider}`}
              </Text>
              <Text className="mt-0.5 text-[13px] leading-[19px] font-normal text-soft">
                {`Your next ${summary.charge} charge is ${summary.due}. Cancel before then to avoid it.`}
              </Text>

              {summary.remindOn && (
                // 16 from the card edge, 2 closer than the text above.
                <View className="-mx-0.5 mt-4 flex-row items-center gap-3.5 rounded-md bg-foreground px-3.5 py-2.5">
                  <View className="size-8 items-center justify-center">
                    <Icon icon={Notification01Icon} size={20} className="text-content" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] leading-[20px] font-semibold text-content">
                      {`Remind me on ${summary.remindOn}`}
                    </Text>
                    <Text className="mt-px text-[12px] leading-[16px] font-normal text-soft">
                      Two days before the charge
                    </Text>
                  </View>
                  <Toggle
                    value={reminder === true}
                    onValueChange={(value) => {
                      track("cancel_reminder_changed", { enabled: value });
                      change(value);
                    }}
                    label={`Remind me on ${summary.remindOn} to cancel ${summary.name}`}
                  />
                </View>
              )}
            </View>
          </View>
        )}

        <View className="mt-auto gap-1 px-screen pb-2">
          <Button label="Done" onPress={() => router.back()} />
          {/* py-1 and hitSlop give the 22px line a 46px touch area. */}
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={undo}
            className="self-center py-1 active:opacity-70"
          >
            <Text className="link-neutral">Undo</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <NotificationPermissionSheet {...sheet} />
    </View>
  );
}

// SafeAreaView can't take className (AGENTS.md), so it is styled here.
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
