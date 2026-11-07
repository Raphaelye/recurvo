import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Illustration } from "@/components/Illustration";
import { NotificationCard } from "@/components/NotificationCard";
import { NotificationPermissionSheet } from "@/components/NotificationPermissionSheet";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useNotificationsSwitch } from "@/hooks/useNotificationsSwitch";
import { useReminders } from "@/hooks/useReminders";
import { track } from "@/lib/posthog";
import type { Reminder } from "@/types/notifications";

// Opened from Home's bell. Lists renewals due within 3 days, soonest first.
export default function NotificationsScreen() {
  const reminders = useReminders();
  const { permission, on, change, sheet } = useNotificationsSwitch();
  // Waits for the permission check, so the button doesn't flash in.
  const showTurnOn = permission !== undefined && !on;

  const openReminder = ({ id, kind }: Reminder) => {
    track("reminder_opened", { source: "notifications", kind });
    router.push({ pathname: "/subscription/[id]", params: { id } });
  };

  return (
    <View className="flex-1 bg-main">
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Notifications" />
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow px-screen pb-4 pt-5"
          showsVerticalScrollIndicator={false}
        >
          {reminders.length > 0 ? (
            <View className="gap-2">
              {reminders.map((reminder) => (
                <NotificationCard
                  key={reminder.id}
                  reminder={reminder}
                  onPress={() => openReminder(reminder)}
                />
              ))}
            </View>
          ) : (
            <EmptyState showTurnOn={showTurnOn} onTurnOn={() => change(true)} />
          )}
        </ScrollView>
      </SafeAreaView>

      <NotificationPermissionSheet {...sheet} />
    </View>
  );
}

type EmptyStateProps = {
  // Notifications are off in Settings or on the phone.
  showTurnOn: boolean;
  onTurnOn: () => void;
};

// Centred a little above the middle of the page.
function EmptyState({ showTurnOn, onTurnOn }: EmptyStateProps) {
  return (
    <View className="flex-1 justify-center pb-16">
      <View className="items-center">
        <Illustration name="noNotifications" width={180} height={144} />
        <Text className="mt-2.5 text-center text-[20px] leading-[26px] font-medium text-content">
          No Notifications Yet
        </Text>
        <Text className="mt-2 text-center text-[11px] leading-[14px] font-medium text-soft">
          We’ll remind you here before a subscription renews.
        </Text>
      </View>

      {showTurnOn && (
        <View className="px-4.5">
          <Button label="Turn on notifications" onPress={onTurnOn} className="mt-[51px]" />
        </View>
      )}
    </View>
  );
}

// SafeAreaView can't take className (AGENTS.md), so it is styled here.
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
