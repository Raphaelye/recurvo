import type { ReactNode } from "react";
import { useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  SlideInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { SafeAreaView } from "react-native-safe-area-context";

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

// Dimmed overlay with a sheet sliding up from the bottom. Tapping the overlay
// or the Android back button closes it.
export function BottomSheet({ visible, onClose, title, subtitle, children }: BottomSheetProps) {
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const translateY = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  const dragStartTranslationY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.set(0);
    }
  }, [translateY, visible]);

  const pan = usePanGesture({
    runOnJS: false,
    activeOffsetY: [-8, 8],
    failOffsetX: [-20, 20],
    onActivate: (event) => {
      "worklet";
      dragStartY.set(translateY.get());
      dragStartTranslationY.set(event.translationY);
    },
    onUpdate: (event) => {
      "worklet";
      const dragDistance = event.translationY - dragStartTranslationY.get();
      const nextY = dragStartY.get() + dragDistance;
      translateY.set(nextY < 0 ? nextY * 0.25 : nextY);
    },
    onDeactivate: (event) => {
      "worklet";
      const dragDistance = event.translationY - dragStartTranslationY.get();
      if (dragDistance > 120 || event.velocityY > 700) {
        if (reduceMotion) {
          scheduleOnRN(onClose);
          return;
        }

        translateY.set(
          withSpring(
            height,
            {
              duration: 300,
              dampingRatio: 0.8,
              velocity: Math.max(event.velocityY, 0),
              overshootClamping: true,
            },
            (finished) => {
              "worklet";
              if (finished) {
                scheduleOnRN(onClose);
              }
            },
          ),
        );
        return;
      }

      if (reduceMotion) {
        translateY.set(withTiming(0, { duration: 150 }));
        return;
      }

      translateY.set(
        withSpring(0, {
          duration: 400,
          dampingRatio: 0.8,
          velocity: event.velocityY,
        }),
      );
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));
  const entering = reduceMotion ? FadeIn.duration(150) : SlideInDown.duration(250);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      {/* pt-20 keeps a tall sheet clear of the status bar. */}
      <View className="flex-1 justify-end pt-20">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          className="sheet-overlay absolute inset-0"
        />
        <Animated.View entering={entering} style={styles.shrink}>
          <Animated.View style={[styles.shrink, sheetStyle]}>
            <View className="sheet shrink">
              <SafeAreaView edges={["bottom"]} style={styles.shrink}>
                <GestureDetector gesture={pan}>
                  <View className="min-h-11 items-center justify-center">
                    <View className="sheet-grabber" />
                    <Text className="text-[22px] leading-[28px] font-bold text-content">
                      {title}
                    </Text>
                    {subtitle && (
                      <Text className="mt-1 text-[15px] leading-[22px] font-normal text-muted">
                        {subtitle}
                      </Text>
                    )}
                  </View>
                </GestureDetector>
                {children}
              </SafeAreaView>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Lets a long sheet shrink to the screen so a ScrollView inside it can scroll.
const styles = StyleSheet.create({
  shrink: {
    flexShrink: 1,
  },
});
