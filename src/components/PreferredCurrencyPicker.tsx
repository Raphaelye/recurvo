import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { CurrencySheet } from "@/components/CurrencySheet";
import { detectCurrency } from "@/lib/currencyDetector";
import type { Currency } from "@/types/currency";

type PreferredCurrencyPickerProps = {
  currency: Currency;
  detected: boolean;
  onChange: (currency: Currency) => void;
};

// Preferred currency row on Create account. "Change" opens a scrollable list of
// every offered currency, the phone's own first.
export function PreferredCurrencyPicker({
  currency,
  detected,
  onChange,
}: PreferredCurrencyPickerProps) {
  const [open, setOpen] = useState(false);
  // Worked out once, so it stays first after the user picks another.
  const [phoneCurrency] = useState(detectCurrency);

  return (
    <>
      <View className="flex-row items-center gap-3 rounded-xl bg-foreground p-3">
        <View className="size-10 items-center justify-center rounded-sm bg-card">
          <Text className="text-[13px] leading-[19px] font-semibold text-content">
            {currency.symbol}
          </Text>
        </View>
        <View className="flex-1">
          <Text numberOfLines={1} className="text-[16px] leading-[22px] font-semibold text-content">
            {`${currency.name} · ${currency.code}`}
          </Text>
          <Text className="text-[13px] leading-[19px] font-normal text-muted">
            {detected ? "Detected from your phone" : "Prices show in this currency"}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change currency, now ${currency.name}`}
          hitSlop={12}
          onPress={() => setOpen(true)}
          className="pr-1 active:opacity-70"
        >
          <Text className="link">Change</Text>
        </Pressable>
      </View>

      <CurrencySheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Preferred currency"
        subtitle="We show prices in this currency."
        selected={currency.code}
        pinned={phoneCurrency.code}
        onChange={onChange}
      />
    </>
  );
}
