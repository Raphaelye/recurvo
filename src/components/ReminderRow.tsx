import { Text, View } from "react-native";

import { NotificationPermissionSheet } from "@/components/NotificationPermissionSheet";
import { Toggle } from "@/components/Toggle";
import { useReminderSwitch } from "@/hooks/useReminderSwitch";

type ReminderRowProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  // Off when editing a subscription, so the saved choice stays.
  startOnIfAllowed?: boolean;
};

// "Remind me" row. It starts on only when notifications are already allowed.
// Switching it on without permission explains why first, then asks.
export function ReminderRow({ value, onChange, startOnIfAllowed = true }: ReminderRowProps) {
  const { change, sheet } = useReminderSwitch(onChange, startOnIfAllowed);

  return (
    <>
      <View className="flex-row items-center gap-3 rounded-lg bg-card px-4 py-3">
        <View className="flex-1">
          <Text className="text-[15px] leading-[22px] font-semibold text-content">Remind me</Text>
          <Text className="mt-0.5 text-[12px] leading-[16px] font-normal text-soft">
            3 days before renewal
          </Text>
        </View>
        <Toggle value={value} onValueChange={change} label="Remind me 3 days before renewal" />
      </View>

      <NotificationPermissionSheet {...sheet} />
    </>
  );
}
