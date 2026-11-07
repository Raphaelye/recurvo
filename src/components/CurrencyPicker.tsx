import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Pressable, Text } from "react-native";

import { CurrencySheet } from "@/components/CurrencySheet";
import { Icon } from "@/components/Icon";

type CurrencyPickerProps = {
  // ISO code, e.g. NGN.
  currency: string;
  // The user's preferred currency, listed first.
  preferred: string;
  onChange: (currency: string) => void;
};

// Currency pill inside the amount field. Opens a searchable list of every offered currency.
export function CurrencyPicker({ currency, preferred, onChange }: CurrencyPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Currency ${currency}. Change`}
        hitSlop={8}
        onPress={() => setOpen(true)}
        className="min-h-7 flex-row items-center gap-1 rounded-full bg-card px-2.5 active:opacity-90"
      >
        <Text className="text-[13px] leading-[19px] font-semibold text-content">{currency}</Text>
        <Icon icon={ArrowDown01Icon} size={16} className="text-content" />
      </Pressable>

      <CurrencySheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Currency"
        subtitle="What this subscription charges in."
        selected={currency}
        pinned={preferred}
        searchable
        onChange={(next) => onChange(next.code)}
      />
    </>
  );
}
