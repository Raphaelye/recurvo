import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { SafeAreaView } from "react-native-safe-area-context";

// Opening and closing without a finger on the sheet. No overshoot: it would
// lift the sheet off the bottom edge and show a gap under it.
const SETTLE = { duration: 300, dampingRatio: 1, overshootClamping: true };

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  // iOS only: called once the sheet has fully closed.
  onDismiss?: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

// Dimmed overlay with a sheet sliding up from the bottom. Tapping the overlay
// or the Android back button closes it.
export function BottomSheet({
  visible,
  onClose,
  onDismiss,
  title,
  subtitle,
  children,
}: BottomSheetProps) {
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  // Starts off screen. The sheet's measured height replaces the window height once laid out.
  const sheetHeight = useSharedValue(height);
  const translateY = useSharedValue(height);
  const dragStartY = useSharedValue(0);
  const dragStartTranslationY = useSharedValue(0);
  // Keeps the Modal up while the sheet slides out after `visible` turns false.
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) {
    setMounted(true);
  }

  // Every close (overlay tap, back button, a choice, a drag) leaves the way the sheet came in.
  // Reduced motion skips the slide: the Modal's own fade opens and closes it.
  useEffect(() => {
    if (reduceMotion) {
      translateY.set(0);
      return;
    }
    if (visible) {
      translateY.set(withSpring(0, SETTLE));
      return;
    }
    translateY.set(
      withSpring(sheetHeight.get(), SETTLE, (finished) => {
        "worklet";
        if (finished) {
          scheduleOnRN(setMounted, false);
        }
      }),
    );
  }, [reduceMotion, sheetHeight, translateY, visible]);

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
            sheetHeight.get(),
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
  // The overlay follows the sheet, so it dims in, out and while dragging in step.
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.get(), [0, sheetHeight.get()], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <Modal
      visible={reduceMotion ? visible : mounted}
      transparent
      animationType={reduceMotion ? "fade" : "none"}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
      onDismiss={onDismiss}
    >
      {/* pt-20 keeps a tall sheet clear of the status bar. The sheet moves up
          with the keyboard, so fields inside it stay visible. */}
      <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end pt-20">
        {/* Animated.View takes style, not className, so the fill is StyleSheet. */}
        <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            className="sheet-overlay flex-1"
          />
        </Animated.View>
        <Animated.View style={[styles.shrink, sheetStyle]}>
          <View
            onLayout={(event) => sheetHeight.set(event.nativeEvent.layout.height)}
            className="sheet shrink"
          >
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Lets a long sheet shrink to the screen so a ScrollView inside it can scroll.
const styles = StyleSheet.create({
  shrink: {
    flexShrink: 1,
  },
});
