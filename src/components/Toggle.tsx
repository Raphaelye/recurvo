import { Host, Toggle as NativeToggle } from "@expo/ui/swift-ui";
import { labelsHidden, tint } from "@expo/ui/swift-ui/modifiers";
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { Pressable, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { useThemeColor } from "@/hooks/useThemeColor";

// iOS 26 gets the native Liquid Glass switch (same check as the tab bar).
// Android and older iPhones get the design's 46 x 28 toggle.
const nativeToggle = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  // Read by screen readers, the toggle shows no text.
  label: string;
};

export function Toggle({ value, onValueChange, label }: ToggleProps) {
  const { scheme } = useTheme();
  const accent = useThemeColor("accent");

  const change = (next: boolean) => {
    Haptics.selectionAsync();
    onValueChange(next);
  };

  if (nativeToggle) {
    // tint makes the "on" track the accent colour. The theme is passed so the
    // "off" track follows the in-app setting, not only the system.
    return (
      <Host matchContents colorScheme={scheme}>
        <NativeToggle
          isOn={value}
          onIsOnChange={change}
          label={label}
          modifiers={accent ? [labelsHidden(), tint(accent)] : [labelsHidden()]}
        />
      </Host>
    );
  }

  // The knob moves when toggle-on aligns it to the end. The layout transition
  // slides it there in 200 ms and follows the reduce-motion setting.
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      onPress={() => change(!value)}
      className={value ? "toggle-on" : "toggle"}
    >
      <Animated.View layout={LinearTransition.duration(200)}>
        <View className="toggle-knob" />
      </Animated.View>
    </Pressable>
  );
}
