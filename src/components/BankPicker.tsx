import { ArrowDown01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { Icon } from "@/components/Icon";
import { Radio } from "@/components/Radio";
import { banks } from "@/data/setup";
import { useThemeColor } from "@/hooks/useThemeColor";
import { cn } from "@/lib/cn";

type BankPickerProps = {
  bank?: string;
  onChange: (bank: string) => void;
};

// "Bank" select field. Opens a searchable list of banks in a bottom sheet.
export function BankPicker({ bank, onChange }: BankPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const placeholderColor = useThemeColor("neutral");
  const matches = banks.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()));

  const choose = (name: string) => {
    if (name !== bank) {
      Haptics.selectionAsync();
      onChange(name);
    }
    setOpen(false);
    setQuery("");
  };

  return (
    <View>
      <Text className="input-label">Bank</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Bank: ${bank ?? "not selected"}`}
        onPress={() => setOpen(true)}
        className="min-h-[56px] flex-row items-center justify-between rounded-md bg-foreground px-4 active:opacity-90"
      >
        <Text
          className={cn(
            "text-[16px] leading-[24px] font-normal",
            bank ? "text-content" : "text-neutral",
          )}
        >
          {bank ?? "Select your bank"}
        </Text>
        <Icon icon={ArrowDown01Icon} size={20} className="text-muted" />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Select your bank">
        <View className="mt-4 min-h-[48px] flex-row items-center gap-2 rounded-md bg-card px-4">
          <Icon icon={Search01Icon} size={18} className="text-neutral" />
          <TextInput
            accessibilityLabel="Search banks"
            placeholder="Search"
            placeholderTextColor={placeholderColor}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            className="flex-1 py-3 text-[16px] leading-[22px] font-normal text-content"
          />
        </View>
        <ScrollView
          className="mt-3 shrink grow-0"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-1">
            {matches.map((name) => {
              const selected = name === bank;
              return (
                <Pressable
                  key={name}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => choose(name)}
                  className={cn(
                    "flex-row items-center gap-3 rounded-lg px-4 py-3",
                    selected && "bg-card",
                  )}
                >
                  <Text className="flex-1 text-[16px] leading-[24px] font-semibold text-content">
                    {name}
                  </Text>
                  <Radio selected={selected} />
                </Pressable>
              );
            })}
            {matches.length === 0 && (
              <Text className="px-4 py-3 text-[15px] leading-[22px] font-normal text-muted">
                No bank matches. Pick Other.
              </Text>
            )}
          </View>
        </ScrollView>
      </BottomSheet>
    </View>
  );
}
