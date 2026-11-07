import * as Haptics from "expo-haptics";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppearanceOptionCard } from "@/components/AppearanceOptionCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { appearanceOptions } from "@/data/appearance";
import { useTheme } from "@/hooks/useTheme";
import { track } from "@/lib/posthog";
import type { ThemePreference } from "@/types/theme";

// Settings > Appearance. The theme changes as soon as an option is tapped.
export default function AppearanceScreen() {
  const { preference, setPreference } = useTheme();

  const choose = (next: ThemePreference) => {
    if (next === preference) {
      return;
    }
    Haptics.selectionAsync();
    setPreference(next);
    track("appearance_changed", { theme: next });
  };

  return (
    <View className="flex-1 bg-main">
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Appearance" />
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-screen pb-4 pt-3.5"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-[15px] leading-[22px] font-normal text-muted">
            Choose how Recurvo looks. System follows your phone’s setting.
          </Text>
          <View accessibilityRole="radiogroup" className="mt-5 gap-4">
            {appearanceOptions.map((option) => (
              <AppearanceOptionCard
                key={option.preference}
                option={option}
                selected={option.preference === preference}
                onPress={() => choose(option.preference)}
              />
            ))}
          </View>
        </ScrollView>
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
