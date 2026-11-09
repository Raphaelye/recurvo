import { useAuth, useUser } from "@clerk/expo";
import { nativeApplicationVersion, nativeBuildVersion } from "expo-application";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppLockRow } from "@/components/AppLockRow";
import { Avatar } from "@/components/Avatar";
import { CurrencySheet } from "@/components/CurrencySheet";
import { NotificationsRow } from "@/components/NotificationsRow";
import { ReviewAlertsSheet } from "@/components/ReviewAlertsSheet";
import { SettingsGroup } from "@/components/SettingsGroup";
import { SettingsRow } from "@/components/SettingsRow";
import { appearanceOptions } from "@/data/appearance";
import { useTheme } from "@/hooks/useTheme";
import { shareSubscriptionsCsv } from "@/lib/exportData";
import { unregisterPushToken } from "@/lib/notifications";
import { track } from "@/lib/posthog";
import { contactSupport, rateApp } from "@/lib/support";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";

type Sheet = "currency" | "reviews";

const version = `Recurvo ${nativeApplicationVersion ?? ""} (build ${nativeBuildVersion ?? ""})`;

export default function SettingsScreen() {
  const { signOut, userId } = useAuth();
  const { user } = useUser();
  const { preference } = useTheme();
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const currency = usePreferencesStore((state) => state.currency);
  const changeCurrency = usePreferencesStore((state) => state.changeCurrency);
  const reviewAlerts = usePreferencesStore((state) => state.notifications.reviewAlerts);
  const setNotifications = usePreferencesStore((state) => state.setNotifications);
  const [sheet, setSheet] = useState<Sheet>();
  const [signingOut, setSigningOut] = useState(false);
  const closeSheet = () => setSheet(undefined);

  // This phone's push token goes first, while the session can still reach
  // Supabase. It waits a few seconds at most, then signs out regardless.
  const signOutHere = async () => {
    if (signingOut) {
      return;
    }
    setSigningOut(true);
    track("signed_out");
    if (userId) {
      await unregisterPushToken(userId);
    }
    signOut();
  };

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  // Accounts created before sign-up asked for a name fall back to their email.
  const fullName = user?.fullName ?? email.split("@")[0];
  const appearance = appearanceOptions.find((option) => option.preference === preference)?.title;

  const exportData = async () => {
    if (subscriptions.length === 0) {
      Alert.alert("Nothing to export yet", "Add a subscription first, then export it here.");
      return;
    }
    try {
      await shareSubscriptionsCsv(subscriptions);
      track("data_exported", { count: subscriptions.length });
    } catch {
      Alert.alert("Couldn’t export your data", "Please try again.");
    }
  };

  return (
    <View className="flex-1 bg-main">
      {/* Bottom edge left out so the content scrolls under the floating tab bar. */}
      <SafeAreaView edges={["top"]} style={styles.container}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-screen pb-28 pt-2"
          showsVerticalScrollIndicator={false}
        >
          <Text
            accessibilityRole="header"
            className="text-[28px] leading-[36px] font-semibold text-content"
          >
            Settings
          </Text>

          <SettingsGroup label="Account" className="mt-[34px]">
            <SettingsRow
              leading={
                <Avatar name={fullName} imageUrl={user?.hasImage ? user.imageUrl : undefined} />
              }
              title={fullName}
              titleClassName="font-semibold text-content"
              subtitle={email}
              chevron
              onPress={() => router.push("/profile")}
              accessibilityLabel={`Profile, ${fullName}`}
              className="py-0.5"
            />
          </SettingsGroup>

          <SettingsGroup label="Preferences" className="mt-4.5">
            <SettingsRow
              title="Currency"
              value={`${currency.code} ${currency.symbol}`}
              chevron
              onPress={() => setSheet("currency")}
            />
            <SettingsRow
              title="Appearance"
              value={appearance}
              chevron
              onPress={() => router.push("/appearance")}
            />
            <NotificationsRow />
            <SettingsRow
              title="Smart review alerts"
              value={reviewAlerts}
              chevron
              onPress={() => setSheet("reviews")}
            />
            <AppLockRow />
          </SettingsGroup>

          <SettingsGroup label="Support & Legal" className="mt-4.5">
            <SettingsRow title="Help & support" chevron onPress={contactSupport} />
            <SettingsRow title="Rate Recurvo" chevron onPress={rateApp} />
            {/* Linked to the landing page once it exists (data/links.ts). */}
            <SettingsRow title="Privacy Policy" chevron />
            <SettingsRow title="Terms of Service" chevron />
          </SettingsGroup>

          <SettingsGroup label="Data & Account" className="mt-4.5">
            <SettingsRow title="Export my data" chevron onPress={exportData} />
            <SettingsRow title="Sign out" onPress={signOutHere} />
            <SettingsRow
              title="Delete account"
              titleClassName="font-medium text-destructive"
              onPress={() => router.push("/delete-account")}
            />
          </SettingsGroup>

          <Text className="mt-4 text-center text-[12px] leading-[16px] font-normal text-muted">
            {version}
          </Text>
        </ScrollView>
      </SafeAreaView>

      <CurrencySheet
        visible={sheet === "currency"}
        title="Currency"
        subtitle="Totals and amounts show in this currency."
        selected={currency.code}
        pinned={currency.code}
        searchable
        onChange={(next) => {
          changeCurrency(next);
          track("currency_changed", { currency: next.code });
        }}
        onClose={closeSheet}
      />
      <ReviewAlertsSheet
        visible={sheet === "reviews"}
        value={reviewAlerts}
        onChange={(next) => {
          setNotifications({ reviewAlerts: next });
          track("review_alerts_changed", { frequency: next });
        }}
        onClose={closeSheet}
      />
    </View>
  );
}

// SafeAreaView can't take className (AGENTS.md), so it is styled here.
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
