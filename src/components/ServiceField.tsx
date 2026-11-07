import { Search01Icon } from "@hugeicons/core-free-icons";
import * as Haptics from "expo-haptics";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Icon } from "@/components/Icon";
import { ServiceLogo } from "@/components/ServiceLogo";
import { serviceNames } from "@/data/serviceNames";
import { useThemeColor } from "@/hooks/useThemeColor";

const MAX_SUGGESTIONS = 4;

type ServiceFieldProps = {
  value: string;
  onChange: (name: string) => void;
};

// "Service" field: free text, with suggestion chips under it. Before anything is
// typed the chips are the popular services, then the names that match.
export function ServiceField({ value, onChange }: ServiceFieldProps) {
  const placeholderColor = useThemeColor("neutral");
  const query = value.trim().toLowerCase();
  const suggestions = (
    query ? serviceNames.filter((name) => name.toLowerCase().includes(query)) : serviceNames
  ).slice(0, MAX_SUGGESTIONS);

  const pick = (name: string) => {
    Haptics.selectionAsync();
    onChange(name);
  };

  return (
    <View>
      <Text className="field-label">Service</Text>
      <View className="min-h-[54px] flex-row items-center gap-2.5 rounded-md bg-foreground px-4">
        <Icon icon={Search01Icon} size={18} className="text-neutral" />
        <TextInput
          accessibilityLabel="Service"
          placeholder="Search or type a service"
          placeholderTextColor={placeholderColor}
          value={value}
          onChangeText={onChange}
          autoCapitalize="words"
          autoCorrect={false}
          className="flex-1 py-3 text-[16px] leading-[22px] font-normal text-content"
        />
      </View>
      {suggestions.length > 0 && (
        // Scrolls sideways: with logos, the four chips are wider than the screen.
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          className="mt-2 grow-0"
          contentContainerClassName="gap-2"
        >
          {suggestions.map((name) => (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityLabel={`Use ${name}`}
              // Takes the 33px chip to a 45px touch area.
              hitSlop={{ top: 6, bottom: 6 }}
              onPress={() => pick(name)}
              className="chip flex-row items-center gap-1.5 active:opacity-90"
            >
              <ServiceLogo name={name} className="size-4 rounded-full" />
              <Text className="chip-label">{name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
