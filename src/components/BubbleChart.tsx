import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { ServiceLogo } from "@/components/ServiceLogo";
import { packBubbles } from "@/lib/bubbles";
import { logosEnabled } from "@/lib/logoDev";
import type { SpendBubble } from "@/types/insights";

type BubbleChartProps = {
  bubbles: SpendBubble[];
  onPress: (id: string) => void;
};

// Bubbles this wide or more show the name under the logo. Smaller ones show the logo only.
const NAME_FROM = 64;
const LOGO_FROM = 28;

// Logo, or the first letter when there is no Logo.dev key.
function BubbleLogo({ name, size }: { name: string; size: number }) {
  if (!logosEnabled) {
    return (
      <Text className="text-[14px] leading-[18px] font-semibold text-content">
        {name.trim()[0]?.toUpperCase()}
      </Text>
    );
  }
  return (
    <ServiceLogo
      name={name}
      className={size >= NAME_FROM ? "size-6 rounded-[5px]" : "size-4 rounded-[3px]"}
    />
  );
}

// Each tracked subscription as a bubble sized by its monthly cost, packed in the
// middle of the chart. Tapping one opens its details.
export function BubbleChart({ bubbles, onPress }: BubbleChartProps) {
  const [area, setArea] = useState({ width: 0, height: 0 });
  const packed = useMemo(
    () =>
      packBubbles(
        bubbles.map((bubble) => ({ id: bubble.id, value: bubble.monthly })),
        area.width,
        area.height,
      ),
    [bubbles, area],
  );

  return (
    <View className="rounded-xl bg-card px-3.5 pb-4 pt-2.5">
      <View className="flex-row justify-between px-1.5">
        <Text className="text-[11px] leading-[14px] font-normal text-muted">
          Big Bubble = Expensive
        </Text>
        <Text className="text-[11px] leading-[14px] font-normal text-muted">
          Small Bubble = Cheap
        </Text>
      </View>

      <View
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setArea((current) =>
            current.width === width && current.height === height ? current : { width, height },
          );
        }}
        className="mt-3 aspect-[334/184] overflow-hidden rounded-lg bg-main"
      >
        {packed.map(({ id, left, top, size }) => {
          const bubble = bubbles.find((candidate) => candidate.id === id);
          if (!bubble) {
            return null;
          }
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityLabel={`${bubble.name}, ${bubble.label} a month`}
              onPress={() => onPress(id)}
              // Size and place come from the data, so they are a runtime style.
              style={{ left, top, width: size, height: size }}
              className="absolute items-center justify-center gap-1 rounded-full bg-foreground px-2 active:opacity-90"
            >
              {size >= LOGO_FROM && <BubbleLogo name={bubble.name} size={size} />}
              {size >= NAME_FROM && (
                <Text
                  numberOfLines={1}
                  className="text-[11px] leading-[14px] font-medium text-content"
                >
                  {bubble.name}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
