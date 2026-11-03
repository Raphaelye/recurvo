import * as Haptics from "expo-haptics";
import { useIsFocused, useRouter } from "expo-router";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { useSceneDriver, type Rect } from "@/components/three/sceneDriver";
import { monthlyAmount } from "@/lib/billing";
import { formatAmount } from "@/lib/currency";
import { track } from "@/lib/posthog";
import { useOnboardingStore } from "@/store/onboardingStore";
import { usePreferencesStore } from "@/store/preferencesStore";

// All set: a burst of 3D coins and confetti around a glass circle with the summary.
export default function Done() {
  const router = useRouter();
  const focused = useIsFocused();
  const resetCard = useOnboardingStore((state) => state.resetCard);
  const finishSetup = useOnboardingStore((state) => state.finishSetup);
  const driverRef = useSceneDriver();
  const [frame, setFrame] = useState<Rect>();
  const circleArea = useRef<ComponentRef<typeof View>>(null);

  // Read once, so the text stays put while the card is reset on the way out.
  const [summary] = useState(() => {
    const { items, card } = useOnboardingStore.getState();
    const { region } = usePreferencesStore.getState();
    const tracked = items.filter((item) => item.tracked && item.cycle);
    const monthly = tracked.reduce((sum, item) => sum + monthlyAmount(item.amount, item.cycle), 0);
    return {
      count: tracked.length,
      monthly: formatAmount(monthly, region.symbol),
      card: card ? `${card.name} •••• ${card.last4}` : undefined,
    };
  });

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const measure = () => {
    circleArea.current?.measureInWindow((x, y, width, height) => setFrame({ x, y, width, height }));
  };

  const goHome = () => {
    track("onboarding_completed", { count: summary.count });
    finishSetup();
    resetCard();
    router.dismissTo("/home");
  };

  // Back to step 2 for the next card. Each card needs its own statement.
  const addAnother = () => {
    resetCard();
    router.dismissAll();
  };

  return (
    <View className="flex-1 bg-main">
      <SceneCanvas mode="celebrate" driverRef={driverRef} frame={frame} active={focused} />
      <SafeAreaView style={styles.container}>
        <View
          ref={circleArea}
          onLayout={measure}
          className="flex-1 items-center justify-center px-screen"
        >
          <View
            accessible
            accessibilityRole="summary"
            className="size-[280px] items-center justify-center overflow-hidden rounded-full border border-line px-7"
          >
            {/* Frosted glass: a translucent surface over the scene glow. */}
            <View className="absolute inset-0 bg-foreground opacity-60" />
            <View className="absolute inset-0 bg-accent opacity-10" />
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              className="text-[28px] leading-[34px] font-bold uppercase text-content"
            >
              You are all set!
            </Text>
            <Text className="mt-3 text-center text-[14px] leading-[20px] font-normal text-muted">
              {`${summary.count} subscription${summary.count === 1 ? "" : "s"} tracked`}
            </Text>
            {summary.card && (
              <Text
                numberOfLines={1}
                className="text-center text-[12px] leading-[16px] font-normal text-soft"
              >
                {`on ${summary.card}`}
              </Text>
            )}
            <Text className="mt-2.5 text-[20px] leading-[26px] font-bold text-accent-text">
              {`${summary.monthly} / month`}
            </Text>
          </View>
        </View>
        <View className="gap-1 px-screen pb-2">
          <Text className="mb-4 px-2 text-center text-[13px] leading-[19px] font-normal text-soft">
            Smart reminders are on. We will nudge you before every renewal.
          </Text>
          <Button label="Go to Home" onPress={goHome} />
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={addAnother}
            className="self-center py-1"
          >
            <Text className="link-neutral">Add another card or bank</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
