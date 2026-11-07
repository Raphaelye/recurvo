import { Search01Icon } from "@hugeicons/core-free-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { Icon } from "@/components/Icon";
import { Radio } from "@/components/Radio";
import { currencies } from "@/data/currencies";
import { useThemeColor } from "@/hooks/useThemeColor";
import { cn } from "@/lib/cn";
import type { Currency } from "@/types/currency";

type CurrencyListProps = {
  // ISO code of the ticked currency.
  selected: string;
  // Listed first, e.g. the preferred or the phone's currency. The rest follow A–Z by code.
  pinned: string;
  // Adds a search field (code or name) above the list.
  searchable?: boolean;
  onChange: (currency: Currency) => void;
  onClose: () => void;
};

type CurrencySheetProps = CurrencyListProps & {
  visible: boolean;
  title: string;
  subtitle: string;
};

// A bottom sheet listing every offered currency (data/currencies.ts).
export function CurrencySheet({ visible, title, subtitle, ...listProps }: CurrencySheetProps) {
  return (
    <BottomSheet visible={visible} onClose={listProps.onClose} title={title} subtitle={subtitle}>
      {/* The sheet's content unmounts once it closes, so the search starts empty each time. */}
      <CurrencyList {...listProps} />
    </BottomSheet>
  );
}

function CurrencyList({ selected, pinned, searchable = false, onChange, onClose }: CurrencyListProps) {
  const [query, setQuery] = useState("");
  const placeholderColor = useThemeColor("neutral");
  const search = query.trim().toLowerCase();
  const ordered = [
    ...currencies.filter((currency) => currency.code === pinned),
    ...currencies.filter((currency) => currency.code !== pinned),
  ];
  const matches = ordered.filter(
    (currency) =>
      currency.code.toLowerCase().includes(search) || currency.name.toLowerCase().includes(search),
  );

  const choose = (currency: Currency) => {
    if (currency.code !== selected) {
      Haptics.selectionAsync();
      onChange(currency);
    }
    onClose();
  };

  return (
    <>
      {searchable && (
        <View className="mt-4 min-h-[48px] flex-row items-center gap-2 rounded-md bg-card px-4">
          <Icon icon={Search01Icon} size={18} className="text-neutral" />
          <TextInput
            accessibilityLabel="Search currencies"
            placeholder="Search"
            placeholderTextColor={placeholderColor}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            className="flex-1 py-3 text-[16px] leading-[22px] font-normal text-content"
          />
        </View>
      )}
      <ScrollView
        className={cn("shrink grow-0", searchable ? "mt-3" : "mt-4")}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-2">
          {matches.map((currency) => {
            const isSelected = currency.code === selected;
            return (
              <Pressable
                key={currency.code}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => choose(currency)}
                className={cn(
                  "flex-row items-center gap-3 rounded-lg px-3 py-2.5",
                  isSelected && "bg-card",
                )}
              >
                <View
                  className={cn(
                    "size-10 items-center justify-center rounded-sm",
                    isSelected ? "bg-foreground" : "bg-card",
                  )}
                >
                  <Text className="text-[13px] leading-[19px] font-semibold text-content">
                    {currency.symbol}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] leading-[22px] font-semibold text-content">
                    {currency.code}
                  </Text>
                  <Text className="text-[13px] leading-[19px] font-normal text-muted">
                    {currency.name}
                  </Text>
                </View>
                <Radio selected={isSelected} />
              </Pressable>
            );
          })}
          {matches.length === 0 && (
            <Text className="px-3 py-3 text-[15px] leading-[22px] font-normal text-muted">
              No currency matches.
            </Text>
          )}
        </View>
      </ScrollView>
    </>
  );
}
