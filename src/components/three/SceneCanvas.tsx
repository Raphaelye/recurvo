import * as Device from "expo-device";
import {
  Component,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
  type RefObject,
} from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { NeutralToneMapping } from "three";

import type { Quality } from "./finishes";
import { useSceneColors } from "./sceneColors";
import { setStage, useTiltParallax, type Rect, type SceneDriver } from "./sceneDriver";
import { SceneFallback } from "./SceneFallback";
import type { SceneMode } from "./world";

// Older devices get the cheaper materials without shadows, and the setup
// scenes use the flat SVG version there.
const LOW_END =
  (Device.totalMemory ?? Infinity) < 3 * 1024 ** 3 || (Device.deviceYearClass ?? Infinity) < 2018;
const QUALITY: Quality = LOW_END ? "low" : "high";

// If the GL context is not up by then, show the SVG version instead.
const GL_TIMEOUT_MS = 8000;

type SceneCanvasProps = {
  mode: SceneMode;
  driverRef: RefObject<SceneDriver>;
  // Welcome only: 0 is the splash, 1 to 3 the beats.
  stage?: number;
  // Window rect the composition should fit in. Defaults to the canvas.
  frame?: Rect;
  // False pauses rendering, e.g. while another screen covers this one.
  active?: boolean;
  // Lets touch (and optional tilt) move the camera. The gestures themselves
  // live on the screen, see useSceneGestures.
  interactive?: boolean;
};

// The 3D scene with its fallbacks. Fills its parent and ignores touches.
// Decorative only: screen readers skip it, the headline carries the meaning.
export function SceneCanvas({
  mode,
  driverRef,
  stage = 0,
  frame,
  active = true,
  interactive = false,
}: SceneCanvasProps) {
  const palette = useSceneColors();
  const reduceMotion = useReducedMotion();
  const [failed, setFailed] = useState(mode !== "welcome" && LOW_END);
  const [ready, setReady] = useState(false);
  const [shownStage, setShownStage] = useState(stage);
  const [canvasRect, setCanvasRect] = useState<Rect>();
  const view = useRef<ComponentRef<typeof View>>(null);
  const opacity = useSharedValue(1);

  const renderScene = () => {
    if (failed) {
      return null;
    }

    const { Canvas } = require("@react-three/fiber/native");
    const { Scene: ThreeScene } = require("./Scene");

    // Neutral tone mapping keeps the accent and brand colours true. The world
    // sets the camera's lens and framing every frame.
    return (
      <Canvas
        frameloop={!active ? "never" : reduceMotion ? "demand" : "always"}
        shadows={QUALITY === "high" ? "percentage" : false}
        gl={{ toneMapping: NeutralToneMapping }}
        camera={{ position: [0, 0, 2000], near: 1, far: 5000 }}
        onCreated={() => setReady(true)}
        style={StyleSheet.absoluteFill}
      >
        <ThreeScene mode={mode} driverRef={driverRef} palette={palette} quality={QUALITY} />
      </Canvas>
    );
  };

  useTiltParallax(driverRef, interactive && active && !reduceMotion);

  useEffect(() => {
    driverRef.current.reduceMotion = reduceMotion;
  }, [driverRef, reduceMotion]);

  useEffect(() => {
    driverRef.current.frame = frame;
  }, [driverRef, frame]);

  // Morph to the new stage, or with reduce motion fade out, swap and fade in.
  useEffect(() => {
    const show = (next: number) => {
      setStage(driverRef.current, next);
      setShownStage(next);
      const { invalidate: invalidateR3F } = require("@react-three/fiber/native");
      invalidateR3F();
      opacity.value = withTiming(1, { duration: 150 });
    };
    if (!reduceMotion || driverRef.current.stage === stage) {
      show(stage);
      return;
    }
    opacity.value = withTiming(0, { duration: 150 }, (finished) => {
      if (finished) {
        scheduleOnRN(show, stage);
      }
    });
  }, [driverRef, opacity, reduceMotion, stage]);

  useEffect(() => {
    if (ready || failed) {
      return;
    }
    const timer = setTimeout(() => setFailed(true), GL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [ready, failed]);

  const measure = () => {
    view.current?.measureInWindow((x, y, width, height) => {
      driverRef.current.canvasRect = { x, y, width, height };
      setCanvasRect({ x, y, width, height });
    });
  };

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  // The fallback works in canvas coordinates.
  const fallbackFrame =
    frame && canvasRect
      ? { ...frame, x: frame.x - canvasRect.x, y: frame.y - canvasRect.y }
      : undefined;

  return (
    <View
      ref={view}
      onLayout={measure}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      <Animated.View style={[StyleSheet.absoluteFill, fadeStyle]}>
        {failed ? (
          <SceneFallback mode={mode} stage={shownStage} palette={palette} frame={fallbackFrame} />
        ) : (
          <SceneBoundary onError={() => setFailed(true)}>{renderScene()}</SceneBoundary>
        )}
      </Animated.View>
    </View>
  );
}

type BoundaryProps = { onError: () => void; children: ReactNode };

// A GL or shader error swaps in the SVG version instead of crashing the screen.
class SceneBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
