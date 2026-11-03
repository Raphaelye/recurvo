import { useAuth } from "@clerk/expo";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import type { ThemePreference } from "@/types/theme";

const appearanceLabels: Record<ThemePreference, string> = {
  system: "System default",
  light: "Light",
  dark: "Dark",
};

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { preference } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-main">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 120 }}>
        <Text className="text-[22px] leading-[28px] font-bold text-content">Settings</Text>

        <View className="mt-6 gap-3">
          <View className="rounded-2xl bg-card p-4">
            <Text className="text-[13px] leading-[19px] font-medium text-muted">Account</Text>
            <Pressable onPress={() => router.push("/setup/upload")} className="mt-4">
              <Text className="text-[16px] leading-[24px] font-semibold text-content">Add a payment method</Text>
            </Pressable>
          </View>

          <View className="rounded-2xl bg-card p-4">
            <Text className="text-[13px] leading-[19px] font-medium text-muted">Preferences</Text>
            <Text className="mt-4 text-[16px] leading-[24px] font-semibold text-content">Appearance</Text>
            <Text className="mt-2 text-[13px] leading-[19px] text-soft">{appearanceLabels[preference]}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => signOut()}
            className="mt-4 rounded-2xl bg-card p-4"
          >
            <Text className="text-[16px] leading-[24px] font-semibold text-destructive">Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
