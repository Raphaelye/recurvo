import { useIsFocused, useRouter } from "expo-router";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { Button } from "@/components/Button";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { useSceneDriver, useSceneGestures, type Rect } from "@/components/three/sceneDriver";
import { images } from "@/constants/images";
import { BEAT_DURATION_MS, welcomeBeats } from "@/data/onboarding";
import { track } from "@/lib/posthog";

// One welcome screen with three beats. Beats move on by themselves (paused
// while a finger is down), by swiping the scene or by tapping the step bar.
export default function Onboarding() {
  const router = useRouter();
  const focused = useIsFocused();
  const [beat, setBeat] = useState(0);
  const [held, setHeld] = useState(false);
  const [frame, setFrame] = useState<Rect>();
  const driverRef = useSceneDriver(1);
  const sceneArea = useRef<ComponentRef<typeof View>>(null);
  const fill = useSharedValue(0);
  const timedBeat = useRef(-1);
  const content = welcomeBeats[beat];

  const goTo = (next: number) => setBeat((next + welcomeBeats.length) % welcomeBeats.length);
  const gesture = useSceneGestures(driverRef, (direction) => goTo(beat + direction));

  useEffect(() => {
    track("onboarding_beat_viewed", { beat: beat + 1 });
  }, [beat]);

  // Auto-advance. The current step fills up over the beat; a new beat starts
  // from empty, a pause (finger down, screen covered) resumes where it was.
  useEffect(() => {
    if (held || !focused) {
      cancelAnimation(fill);
      return;
    }
    const from = timedBeat.current === beat ? fill.value : 0;
    timedBeat.current = beat;
    const next = (beat + 1) % welcomeBeats.length;
    fill.value = from;
    fill.value = withTiming(
      1,
      { duration: BEAT_DURATION_MS * (1 - from), easing: Easing.linear },
      (finished) => {
        if (finished) {
          scheduleOnRN(setBeat, next);
        }
      },
    );
  }, [beat, held, focused, fill]);

  const measureScene = () => {
    sceneArea.current?.measureInWindow((x, y, width, height) => setFrame({ x, y, width, height }));
  };

  const getStarted = () => {
    track("onboarding_get_started");
    router.push("/sign-up");
  };

  return (
    <View
      className="flex-1 bg-main"
      onTouchStart={() => setHeld(true)}
      onTouchEnd={() => setHeld(false)}
      onTouchCancel={() => setHeld(false)}
    >
      <SceneCanvas
        mode="welcome"
        driverRef={driverRef}
        stage={beat + 1}
        frame={frame}
        active={focused}
        interactive
      />

      <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
        <SafeAreaView style={styles.container}>
          <View className="flex-1 px-screen pt-0.5">
            <Image
              source={images.logo}
              resizeMode="contain"
              accessibilityLabel="Recurvo"
              className="size-8"
            />
            <View className="mt-3 flex-row items-center">
              <View className="flex-row gap-1.5">
                {welcomeBeats.map((item, index) => (
                  <StepSegment
                    key={item.eyebrow}
                    index={index}
                    beat={beat}
                    fill={fill}
                    onPress={() => goTo(index)}
                  />
                ))}
              </View>
              <Animated.View key={beat} entering={FadeIn.duration(250)} style={styles.caption}>
                <Text numberOfLines={1} className="text-[13px] leading-[19px] font-normal text-soft">
                  {content.caption}
                </Text>
              </Animated.View>
            </View>

            {/* The scene shows through here. Swipe or tap it. */}
            <GestureDetector gesture={gesture}>
              <View
                ref={sceneArea}
                onLayout={measureScene}
                accessibilityHint="Swipe to see the next card"
                className="flex-1"
              />
            </GestureDetector>

            <Animated.View key={beat} entering={FadeIn.duration(300)}>
              <Text
                accessibilityRole="header"
                className="text-[12px] leading-[16px] font-bold uppercase tracking-[1.2px] text-accent-text"
              >
                {content.eyebrow}
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                className="mt-3.5 text-[34px] leading-[42px] font-semibold text-content"
              >
                {content.title[0]}
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                className="text-[34px] leading-[42px] font-semibold text-muted"
              >
                {content.title[1]}
              </Text>
            </Animated.View>

            <View className="mt-5 gap-3">
              <Button label="Get started" onPress={getStarted} />
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/sign-in")}
                className="btn-secondary"
              >
                <Text className="btn-label-secondary">I already have an account</Text>
              </Pressable>
            </View>
            <Text className="mb-1 mt-4 px-2 text-center text-[12px] leading-[17px] font-normal text-soft">
              Recurvo only reads statements you choose to upload. Never your full card number or CVV.
            </Text>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

type StepSegmentProps = {
  index: number;
  beat: number;
  fill: SharedValue<number>;
  onPress: () => void;
};

// One of the three bars at the top. Past beats are full, the current one fills
// up while it is on screen.
function StepSegment({ index, beat, fill, onPress }: StepSegmentProps) {
  const fillStyle = useAnimatedStyle(() => ({
    width: `${(index < beat ? 1 : index === beat ? fill.value : 0) * 100}%`,
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Show card ${index + 1} of 3`}
      accessibilityState={{ selected: index === beat }}
      hitSlop={{ top: 20, bottom: 20, left: 3, right: 3 }}
      onPress={onPress}
      className="h-1 w-8 overflow-hidden rounded-full bg-progress-track"
    >
      <Animated.View style={[styles.segmentFill, fillStyle]}>
        <View className="flex-1 bg-accent" />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  caption: {
    flexShrink: 1,
    marginLeft: 14,
  },
  segmentFill: {
    height: "100%",
  },
});
