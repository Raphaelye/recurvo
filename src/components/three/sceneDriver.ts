import * as Haptics from "expo-haptics";
import { DeviceMotion } from "expo-sensors";
import { useEffect, useRef, type RefObject } from "react";
import { useCompetingGestures, usePanGesture, useTapGesture } from "react-native-gesture-handler";

// Device-tilt parallax. Off by default: touch parallax is enough and tilt
// keeps the motion sensor running while the screen is open.
export const TILT_PARALLAX = false;

export type Rect = { x: number; y: number; width: number; height: number };

// Shared, mutable state between the screen, its gestures and the render loop.
// It is a ref, so writing to it never re-renders React; the scene reads it
// every frame.
export type SceneDriver = {
  // Welcome: 0 is the splash, 1 to 3 the beats.
  stage: number;
  previousStage: number;
  // performance.now() in seconds when the stage changed.
  stageChangedAt: number;
  // Scanning: parser progress, 0 to 1.
  progress: number;
  // Touch or tilt parallax, -1 to 1 on each axis.
  parallax: { x: number; y: number };
  // Window rect of the canvas, to turn tap positions into canvas positions.
  canvasRect: Rect;
  // Canvas rect the composition should fit in. Defaults to the whole canvas.
  frame?: Rect;
  reduceMotion: boolean;
  // Set by the scene. Returns true when a tap hit something that reacted.
  pick?: (x: number, y: number) => boolean;
};

export function now() {
  return performance.now() / 1000;
}

export function useSceneDriver(stage = 0) {
  return useRef<SceneDriver>({
    stage,
    previousStage: stage,
    stageChangedAt: now(),
    progress: 0,
    parallax: { x: 0, y: 0 },
    canvasRect: { x: 0, y: 0, width: 0, height: 0 },
    reduceMotion: false,
  });
}

export function setStage(driver: SceneDriver, stage: number) {
  if (driver.stage !== stage) {
    driver.previousStage = driver.stage;
    driver.stage = stage;
    driver.stageChangedAt = now();
  }
}

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

// Pan for parallax and swipes between beats, tap to poke a prop.
export function useSceneGestures(
  driverRef: RefObject<SceneDriver>,
  onSwipe: (direction: 1 | -1) => void,
) {
  const pan = usePanGesture({
    runOnJS: true,
    minDistance: 8,
    onUpdate: (event) => {
      driverRef.current.parallax.x = clamp(event.translationX / 180);
      driverRef.current.parallax.y = clamp(event.translationY / 180);
    },
    onDeactivate: (event) => {
      const swipe = Math.abs(event.translationX) > 60 || Math.abs(event.velocityX) > 600;
      if (swipe && Math.abs(event.translationX) > Math.abs(event.translationY)) {
        onSwipe(event.translationX < 0 ? 1 : -1);
      }
    },
    onFinalize: () => {
      driverRef.current.parallax.x = 0;
      driverRef.current.parallax.y = 0;
    },
  });

  const tap = useTapGesture({
    runOnJS: true,
    onActivate: (event) => {
      const { canvasRect, pick } = driverRef.current;
      if (pick?.(event.absoluteX - canvasRect.x, event.absoluteY - canvasRect.y)) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
  });

  return useCompetingGestures(pan, tap);
}

// Optional tilt parallax (TILT_PARALLAX). Eases back to centre when off.
export function useTiltParallax(driverRef: RefObject<SceneDriver>, enabled: boolean) {
  useEffect(() => {
    if (!TILT_PARALLAX || !enabled) {
      return;
    }
    DeviceMotion.setUpdateInterval(50);
    const subscription = DeviceMotion.addListener(({ rotation }) => {
      if (rotation) {
        driverRef.current.parallax.x = clamp(rotation.gamma / 0.5);
        driverRef.current.parallax.y = clamp((rotation.beta - 0.8) / 0.5);
      }
    });
    return () => subscription.remove();
  }, [driverRef, enabled]);
}
