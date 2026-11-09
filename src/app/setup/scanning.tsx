import { useIsFocused, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AccentTint } from "@/components/AccentTint";
import { CheckCircle } from "@/components/CheckCircle";
import { FlowFooter } from "@/components/FlowScreen";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { useSceneDriver } from "@/components/three/sceneDriver";
import { scanSteps } from "@/data/setup";
import { cn } from "@/lib/cn";
import { track } from "@/lib/posthog";
import { isAbortError, isLimitError, statementParser } from "@/lib/statementParser";
import { useOnboardingStore } from "@/store/onboardingStore";

// Reads the statement with the parser's progress, an estimate until the result
// arrives. The 3D beam reads down the statement with it and lets each
// subscription's coin out as it passes. Leaving the screen cancels the scan.
export default function Scanning() {
  const router = useRouter();
  const focused = useIsFocused();
  const file = useOnboardingStore((state) => state.file);
  const bank = useOnboardingStore((state) => state.bank);
  const card = useOnboardingStore((state) => state.card);
  const setCard = useOnboardingStore((state) => state.setCard);
  const setDetected = useOnboardingStore((state) => state.setDetected);
  const discardStatement = useOnboardingStore((state) => state.discardStatement);
  const finishSetup = useOnboardingStore((state) => state.finishSetup);
  const driverRef = useSceneDriver();
  const [percent, setPercent] = useState(0);
  // "limit": the account sent too many statements today, so trying again won't help.
  const [failed, setFailed] = useState<false | "unreadable" | "limit">(false);
  const [attempt, setAttempt] = useState(0);
  const announced = useRef(0);

  useEffect(() => {
    if (!file) {
      return;
    }
    const controller = new AbortController();
    driverRef.current.progress = 0;
    announced.current = 0;

    statementParser
      .parse(
        file,
        bank ?? "Other",
        (progress) => {
          // The scene reads the exact value every frame; React only re-renders
          // when the whole percentage changes.
          driverRef.current.progress = progress;
          const value = Math.floor(progress * 100);
          setPercent(value);
          const quarter = Math.floor(value / 25) * 25;
          if (quarter > announced.current) {
            announced.current = quarter;
            AccessibilityInfo.announceForAccessibility(`Scanning, ${quarter} percent`);
          }
        },
        controller.signal,
      )
      .then((result) => {
        // A card typed in by hand wins over the one read from the statement.
        if (!useOnboardingStore.getState().card && result.card) {
          setCard("found", result.card);
        }
        setDetected(result.subscriptions, result.currency);
        // Parsed: the statement is deleted, only the subscriptions are kept.
        discardStatement();
        track("scan_completed", { count: result.subscriptions.length });
        // Replace, so going back from the results returns to the upload step.
        router.replace("/setup/review");
      })
      .catch((error: unknown) => {
        if (isLimitError(error)) {
          setFailed("limit");
          AccessibilityInfo.announceForAccessibility("You've scanned a lot today");
        } else if (!isAbortError(error)) {
          setFailed("unreadable");
          AccessibilityInfo.announceForAccessibility("We couldn't read this statement");
        }
      });

    return () => controller.abort();
  }, [file, bank, attempt, driverRef, router, setCard, setDetected, discardStatement]);

  const retry = () => {
    setFailed(false);
    setPercent(0);
    setAttempt((value) => value + 1);
  };

  const addManually = () => {
    track("manual_fallback_used", { from: failed ? "scan_error" : "scanning" });
    finishSetup();
    router.dismissTo("/home");
  };

  const progress = percent / 100;

  return (
    <View className="flex-1 bg-main">
      <SafeAreaView style={styles.container}>
        <View className="flex-[2]">
          <SceneCanvas mode="scan" driverRef={driverRef} active={focused} />
        </View>

        {failed ? (
          <View className="px-screen" accessibilityLiveRegion="assertive">
            <Text className="text-center text-[22px] leading-[28px] font-bold text-content">
              {failed === "limit" ? "You’ve scanned a lot today" : "We couldn’t read this statement"}
            </Text>
            <Text className="mt-2 text-center text-[15px] leading-[22px] font-normal text-muted">
              {failed === "limit"
                ? "Try again tomorrow, or add your subscriptions manually. Nothing was saved."
                : "Check it’s the PDF or CSV export from your bank app and try again. Nothing was saved."}
            </Text>
          </View>
        ) : (
          <View className="px-screen">
            <Text
              accessibilityRole="progressbar"
              accessibilityLabel="Scan progress"
              accessibilityValue={{ min: 0, max: 100, now: percent }}
              className="text-center text-[48px] leading-[56px] font-extrabold text-content"
            >
              {`${percent}%`}
            </Text>
            <Text className="mt-4 text-center text-[22px] leading-[28px] font-bold text-content">
              Finding your subscriptions
            </Text>
            <Text className="mt-1 text-center text-[13px] leading-[19px] font-normal text-muted">
              Reading your statement
            </Text>
            <View className="mt-6 gap-3.5 rounded-xl bg-foreground p-4.5">
              {scanSteps.map((step, index) => {
                const done = progress >= step.endsAt;
                const active = !done && progress >= (scanSteps[index - 1]?.endsAt ?? 0);
                const label =
                  index === 0 && card ? `Card found: ${card.name} •••• ${card.last4}` : step.label;
                return (
                  <View key={step.label} className="flex-row items-center gap-3">
                    {done && <CheckCircle className="size-6" />}
                    {active && (
                      <AccentTint className="size-6 rounded-full">
                        <View className="size-2.5 rounded-full bg-accent" />
                      </AccentTint>
                    )}
                    {!done && !active && (
                      <View className="size-6 rounded-full border-[1.5px] border-neutral" />
                    )}
                    <Text
                      numberOfLines={1}
                      className={cn(
                        "flex-1 text-[15px] leading-[22px] font-normal",
                        done || active ? "text-content" : "text-soft",
                      )}
                    >
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View className="flex-1" />
        <FlowFooter
          button={failed === "unreadable" ? { label: "Try again", onPress: retry } : undefined}
          link={{ label: "Add manually instead", onPress: addManually }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
