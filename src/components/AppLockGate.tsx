import { useCallback, useEffect, useRef } from "react";
import { AppState, Image, Modal, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { images } from "@/constants/images";
import { unlockWithBiometrics } from "@/lib/biometrics";
import { useAppLockStore } from "@/store/appLockStore";

// Back after this long in the background, the app locks again. Shorter trips
// out, such as copying a code, don't.
const LOCK_AFTER_MS = 60_000;

// Covers the app with the lock screen while App lock is on and the app is locked.
// The root layout renders it only for a signed-in user, after the launch splash.
export function AppLockGate() {
  const enabled = useAppLockStore((state) => state.enabled);
  const locked = useAppLockStore((state) => state.locked);
  const lock = useAppLockStore((state) => state.lock);
  const unlock = useAppLockStore((state) => state.unlock);
  const backgroundSince = useRef<number | undefined>(undefined);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      // "inactive" is left out: the Face ID prompt itself makes the app inactive.
      if (state === "background") {
        backgroundSince.current = Date.now();
        return;
      }
      if (state === "active" && backgroundSince.current !== undefined) {
        if (enabled && Date.now() - backgroundSince.current >= LOCK_AFTER_MS) {
          lock();
        }
        backgroundSince.current = undefined;
      }
    });
    return () => subscription.remove();
  }, [enabled, lock]);

  // A Modal, so the lock screen also covers bottom sheets.
  return (
    <Modal visible={enabled && locked} animationType="fade" statusBarTranslucent>
      <LockScreen onUnlock={unlock} />
    </Modal>
  );
}

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const unlock = useCallback(async () => {
    if (await unlockWithBiometrics("Unlock Recurvo")) {
      onUnlock();
    }
  }, [onUnlock]);

  // Asks as soon as the lock screen appears. The Unlock button asks again after a cancel.
  useEffect(() => {
    unlock();
  }, [unlock]);

  return (
    <View className="flex-1 bg-main">
      <SafeAreaView style={styles.container}>
        <View className="flex-1 items-center justify-center px-screen-lg">
          <Image source={images.logo} accessibilityIgnoresInvertColors className="size-16" />
          <Text className="mt-6 text-center text-[22px] leading-[28px] font-bold text-content">
            Recurvo is locked
          </Text>
          <Text className="mt-2 text-center text-[15px] leading-[22px] font-normal text-muted">
            Unlock with Face ID, your fingerprint or your passcode.
          </Text>
        </View>
        <View className="px-screen pb-1.5 pt-4">
          <Button label="Unlock" onPress={unlock} />
        </View>
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
