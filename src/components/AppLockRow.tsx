import { useState } from "react";
import { Alert } from "react-native";

import { SettingsRow } from "@/components/SettingsRow";
import { Toggle } from "@/components/Toggle";
import { canLockApp, unlockWithBiometrics } from "@/lib/biometrics";
import { track } from "@/lib/posthog";
import { useAppLockStore } from "@/store/appLockStore";

// Settings' App lock switch. Turning it on asks for Face ID, a fingerprint or the
// passcode first, so nobody can lock the owner out of their own app.
export function AppLockRow() {
  const enabled = useAppLockStore((state) => state.enabled);
  const setEnabled = useAppLockStore((state) => state.setEnabled);
  // Holds the switch on while the system prompt is up.
  const [checking, setChecking] = useState(false);

  const change = async (next: boolean) => {
    if (!next) {
      setEnabled(false);
      track("app_lock_changed", { enabled: false });
      return;
    }
    setChecking(true);
    if (!(await canLockApp())) {
      setChecking(false);
      Alert.alert(
        "Set up a screen lock first",
        "Turn on Face ID, a fingerprint or a passcode in your phone’s Settings to use App lock.",
      );
      return;
    }
    const unlocked = await unlockWithBiometrics("Turn on App lock");
    setChecking(false);
    if (unlocked) {
      setEnabled(true);
      track("app_lock_changed", { enabled: true });
    }
  };

  return (
    <SettingsRow
      title="App lock"
      trailing={<Toggle value={checking || enabled} onValueChange={change} label="App lock" />}
    />
  );
}
