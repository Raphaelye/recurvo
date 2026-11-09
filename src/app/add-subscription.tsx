import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { CurrencyPicker } from "@/components/CurrencyPicker";
import { DateField } from "@/components/DateField";
import { PaymentMethodPicker } from "@/components/PaymentMethodPicker";
import { ReminderRow } from "@/components/ReminderRow";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SegmentedControl } from "@/components/SegmentedControl";
import { ServiceField } from "@/components/ServiceField";
import { billingCycles } from "@/data/setup";
import { useThemeColor } from "@/hooks/useThemeColor";
import { upcomingRenewal } from "@/lib/billing";
import { cn } from "@/lib/cn";
import { currencySymbol, startRateFor } from "@/lib/currency";
import { track } from "@/lib/posthog";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useRatesStore } from "@/store/ratesStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import type { BillingCycle, PaymentCard } from "@/types/setup";

// Digits and one decimal point, with at most 2 decimals. Some keyboards type a
// comma as the decimal point.
function cleanAmount(text: string) {
  const [whole, ...decimals] = text.replace(/,/g, ".").replace(/[^\d.]/g, "").split(".");
  return decimals.length > 0 ? `${whole}.${decimals.join("").slice(0, 2)}` : whole;
}

// Manual entry, the fallback to importing a statement. Opened from Home's +
// button and from the setup flow's "add manually" links. With an id it edits
// that subscription, opened from the details modal's pencil.
export default function AddSubscription() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const placeholderColor = useThemeColor("neutral");
  const preferred = usePreferencesStore((state) => state.currency);
  const rates = useRatesStore((state) => state.rates);
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const addSubscriptions = useSubscriptionStore((state) => state.add);
  const updateSubscription = useSubscriptionStore((state) => state.update);
  const editing = subscriptions.find((subscription) => subscription.id === id);
  const [name, setName] = useState(editing?.name ?? "");
  const [amountText, setAmountText] = useState(editing ? String(editing.amount) : "");
  const [currency, setCurrency] = useState(editing?.currency ?? preferred.code);
  const [cycle, setCycle] = useState<BillingCycle>(editing?.cycle ?? "Monthly");
  // A saved date that has passed shows as the next renewal after it.
  const [nextRenewal, setNextRenewal] = useState(
    editing ? upcomingRenewal(editing.nextRenewal, editing.cycle).toISOString() : undefined,
  );
  const [card, setCard] = useState<PaymentCard | undefined>(editing?.card);
  const [remind, setRemind] = useState(editing?.remind ?? false);
  const [saving, setSaving] = useState(false);

  const symbol = currencySymbol(currency);
  const amount = Number(amountText);
  const ready = name.trim().length > 0 && amount > 0 && !!nextRenewal && !!card;

  const save = async () => {
    // nextRenewal and card are repeated so TypeScript knows they are set.
    if (!ready || !nextRenewal || !card) {
      return;
    }
    setSaving(true);
    const details = { name: name.trim(), amount, currency, cycle, nextRenewal, card, remind };
    // The rate the "since you started" review compares against.
    const startRate = startRateFor(currency, preferred.code, rates);
    // A new currency starts its rate history again.
    const saved = editing
      ? await updateSubscription(
          editing.id,
          currency === editing.currency ? details : { ...details, startRate },
        )
      : await addSubscriptions([
          { id: `manual-${Date.now()}`, ...details, addedAt: new Date().toISOString(), startRate },
        ]);
    // Not saved: the store has told the user, and the form stays as it was.
    if (!saved) {
      setSaving(false);
      return;
    }
    if (editing) {
      track("subscription_edited", { cycle, remind });
    } else {
      track("subscription_added", { source: "manual", cycle, remind });
    }
    router.back();
  };

  return (
    <View className="flex-1 bg-main">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <ScreenHeader title={editing ? "Edit Subscription" : "Add Subscription"} />

          <ScrollView
            className="flex-1"
            contentContainerClassName="gap-4 px-screen pb-4 pt-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ServiceField value={name} onChange={setName} />

            <View>
              <Text className="field-label">Amount</Text>
              <View className="min-h-[54px] flex-row items-center gap-2.5 rounded-md bg-foreground px-4">
                <Text
                  className={cn(
                    "text-[16px] leading-[22px] font-normal",
                    amountText ? "text-content" : "text-neutral",
                  )}
                >
                  {symbol}
                </Text>
                <TextInput
                  accessibilityLabel={`Amount in ${currency}`}
                  placeholder="0.00"
                  placeholderTextColor={placeholderColor}
                  value={amountText}
                  onChangeText={(text) => setAmountText(cleanAmount(text))}
                  keyboardType="decimal-pad"
                  className="flex-1 py-3 text-[16px] leading-[22px] font-normal text-content"
                />
                <CurrencyPicker
                  currency={currency}
                  preferred={preferred.code}
                  onChange={setCurrency}
                />
              </View>
            </View>

            <View>
              <Text className="field-label">Billing cycle</Text>
              <SegmentedControl options={billingCycles} value={cycle} onChange={setCycle} />
            </View>

            <DateField label="Next renewal" value={nextRenewal} onChange={setNextRenewal} />

            <PaymentMethodPicker
              card={card}
              savedCards={subscriptions.map((subscription) => subscription.card)}
              onChange={setCard}
            />

            <ReminderRow value={remind} onChange={setRemind} startOnIfAllowed={!editing} />
          </ScrollView>

          <View className="px-screen pb-1.5 pt-4">
            <Button
              label={editing ? "Save Changes" : "Save Subscription"}
              onPress={save}
              disabled={!ready}
              loading={saving}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// SafeAreaView can't take className (AGENTS.md), so it is styled here.
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
