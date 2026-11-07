import { NotificationPermissionSheet } from "@/components/NotificationPermissionSheet";
import { SettingsRow } from "@/components/SettingsRow";
import { Toggle } from "@/components/Toggle";
import { useNotificationsSwitch } from "@/hooks/useNotificationsSwitch";

// Settings' Notifications switch. It shows on when the account wants notifications
// and the phone allows them, and stays on while the permission sheet asks, so it
// doesn't flick back first.
export function NotificationsRow() {
  const { on, asking, change, sheet } = useNotificationsSwitch();

  return (
    <>
      <SettingsRow
        title="Notifications"
        trailing={<Toggle value={asking || on} onValueChange={change} label="Notifications" />}
      />
      <NotificationPermissionSheet {...sheet} />
    </>
  );
}
