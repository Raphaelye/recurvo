import * as Haptics from "expo-haptics";
import { styled } from "nativewind";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";

import { useThemeColor } from "@/hooks/useThemeColor";
import { cn } from "@/lib/cn";

const StyledAnimatedText = styled(Animated.Text);

// The pill moves across the control, so ease-in-out. 150 ms keeps it out of the
// way on a control switched tens of times a day. Reduced motion: it jumps.
const SLIDE = { transitionDuration: 150, transitionTimingFunction: "ease-in-out" as const };
const NO_SLIDE = { transitionDuration: 0 };

// The track's padding (p-1), on each side.
const TRACK_PADDING = 4;

type SegmentedControlProps<T extends string> = {
  options: readonly T[];
  // Nothing is selected while this is undefined.
  value?: T;
  onChange: (value: T) => void;
  className?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const reduceMotion = useReducedMotion();
  const onAccent = useThemeColor("on-accent");
  const content = useThemeColor("content");
  // Segments share the width equally. Measured on layout, never per frame.
  const [segmentWidth, setSegmentWidth] = useState(0);
  const index = value === undefined ? -1 : options.indexOf(value);
  const transition = reduceMotion ? NO_SLIDE : SLIDE;

  const select = (option: T) => {
    if (option !== value) {
      Haptics.selectionAsync();
      onChange(option);
    }
  };

  return (
    <View
      accessibilityRole="radiogroup"
      onLayout={(event) =>
        setSegmentWidth((event.nativeEvent.layout.width - TRACK_PADDING * 2) / options.length)
      }
      className={cn("segmented", className)}
    >
      {/* One orange pill slides under the labels. It mounts already in place, so
          only a change of selection animates it. */}
      {index >= 0 && segmentWidth > 0 && (
        <Animated.View
          style={[
            styles.pill,
            {
              width: segmentWidth,
              transform: [{ translateX: index * segmentWidth }],
              transitionProperty: "transform",
              ...transition,
            },
          ]}
        >
          <View className="flex-1 rounded-full bg-accent" />
        </Animated.View>
      )}
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => select(option)}
            // Until the pill is measured, the selected segment draws its own fill.
            className={selected && segmentWidth === 0 ? "segment-selected" : "segment"}
          >
            {/* The label colour changes with the pill, so it never sits white on the track. */}
            <StyledAnimatedText
              numberOfLines={1}
              style={{
                color: selected ? onAccent : content,
                transitionProperty: "color",
                ...transition,
              }}
              className="text-[14px] leading-[20px] font-semibold"
            >
              {option}
            </StyledAnimatedText>
          </Pressable>
        );
      })}
    </View>
  );
}

// Animated.View takes style, not className, so the pill's position is StyleSheet.
const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    left: TRACK_PADDING,
    pointerEvents: "none",
  },
});
