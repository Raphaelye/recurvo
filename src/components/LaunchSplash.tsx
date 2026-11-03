import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { SceneCanvas } from "@/components/three/SceneCanvas";
import { useSceneDriver } from "@/components/three/sceneDriver";
import { images } from "@/constants/images";
import { SPLASH_DURATION_MS } from "@/data/onboarding";

type LaunchSplashProps = {
  onDone: () => void;
};

export function LaunchSplash({ onDone }: LaunchSplashProps) {
  const driverRef = useSceneDriver(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(
      1,
      { duration: SPLASH_DURATION_MS, easing: Easing.inOut(Easing.quad) },
      (finished) => {
        if (finished) {
          scheduleOnRN(onDone);
        }
      },
    );
  }, [onDone, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View className="flex-1 bg-main">
      <SceneCanvas mode="welcome" driverRef={driverRef} stage={0} />
      <SafeAreaView style={styles.container}>
        <View className="flex-1 items-center justify-center pt-9">
          <Image source={images.logo} resizeMode="contain" className="size-[84px]" />
          <Text className="mt-6 text-[42px] leading-[50px] font-bold text-content">Recurvo</Text>
          <Text className="mt-2 text-[15px] leading-[22px] font-normal text-muted">
            Smart Billing
          </Text>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Loading"
          className="mb-9 h-[3px] w-24 self-center overflow-hidden rounded-full bg-progress-track"
        >
          <Animated.View style={[styles.segmentFill, fillStyle]}>
            <View className="flex-1 bg-accent" />
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
  },
  segmentFill: {
    height: "100%",
  },
});
