import { Tick02Icon } from "@hugeicons/core-free-icons";
import { View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  withTiming,
  type EntryExitAnimationFunction,
} from "react-native-reanimated";

import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

// The tick lands when it appears: a scan step done, a subscription ticked, a card found.
// Reduced motion keeps the fade and drops the scale.
const tickIn: EntryExitAnimationFunction = () => {
  "worklet";
  return {
    initialValues: { opacity: 0, transform: [{ scale: 0.9 }] },
    animations: {
      opacity: withTiming(1, { duration: 200, easing: EASE_OUT, reduceMotion: ReduceMotion.Never }),
      transform: [{ scale: withTiming(1, { duration: 200, easing: EASE_OUT }) }],
    },
  };
};

// Orange circle with a white tick. Set the size with className, e.g. size-6.
// A list that shows ticks on load wraps itself in <LayoutAnimationConfig skipEntering>.
export function CheckCircle({ className }: { className?: string }) {
  return (
    <Animated.View entering={tickIn}>
      <View className={cn("check-circle", className)}>
        <Icon icon={Tick02Icon} size={14} className="text-on-accent" />
      </View>
    </Animated.View>
  );
}
