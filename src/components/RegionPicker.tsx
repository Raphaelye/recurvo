import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { Radio } from "@/components/Radio";
import { countries } from "@/data/setup";
import { cn } from "@/lib/cn";
import type { Country } from "@/types/setup";

type RegionPickerProps = {
  region: Country;
  detected: boolean;
  onChange: (region: Country) => void;
};

function badge(country: Country) {
  return country.code === "OTHER" ? "$" : country.code;
}

// Country and currency row with a "Change" link that opens the country list.
export function RegionPicker({ region, detected, onChange }: RegionPickerProps) {
  const [open, setOpen] = useState(false);

  const choose = (country: Country) => {
    if (country.code !== region.code) {
      Haptics.selectionAsync();
      onChange(country);
    }
    setOpen(false);
  };

  return (
    <>
      <View className="flex-row items-center gap-3 rounded-xl bg-foreground p-3">
        <View className="size-10 items-center justify-center rounded-sm bg-card">
          <Text className="text-[13px] leading-[19px] font-semibold text-content">
            {badge(region)}
          </Text>
        </View>
        <View className="flex-1">
          <Text numberOfLines={1} className="text-[16px] leading-[22px] font-semibold text-content">
            {`${region.name} · ${region.currency} ${region.symbol}`}
          </Text>
          <Text className="text-[13px] leading-[19px] font-normal text-muted">
            {detected ? "Detected from your phone" : "Prices show in this currency"}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change country, now ${region.name}`}
          hitSlop={12}
          onPress={() => setOpen(true)}
          className="pr-1"
        >
          <Text className="link">Change</Text>
        </Pressable>
      </View>

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Where are you based?"
        subtitle="We show prices in this currency."
      >
        <View className="mt-4 gap-2">
          {countries.map((country) => {
            const selected = country.code === region.code;
            return (
              <Pressable
                key={country.code}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => choose(country)}
                className={cn(
                  "flex-row items-center gap-3 rounded-lg px-3 py-2.5",
                  selected && "bg-card",
                )}
              >
                <View
                  className={cn(
                    "size-10 items-center justify-center rounded-sm",
                    selected ? "bg-foreground" : "bg-card",
                  )}
                >
                  <Text className="text-[13px] leading-[19px] font-semibold text-content">
                    {badge(country)}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] leading-[22px] font-semibold text-content">
                    {country.name}
                  </Text>
                  <Text className="text-[13px] leading-[19px] font-normal text-muted">
                    {`${country.currency} · ${country.symbol}`}
                  </Text>
                </View>
                <Radio selected={selected} />
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </>
  );
}
