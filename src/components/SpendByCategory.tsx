import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { BubbleChart } from "@/components/BubbleChart";
import { cn } from "@/lib/cn";
import type { CategorySpend, SpendBubble } from "@/types/insights";
import type { ServiceCategory } from "@/types/subscription";

type Filter = "All" | ServiceCategory;

type SpendByCategoryProps = {
  categories: CategorySpend[];
  bubbles: SpendBubble[];
  onOpen: (id: string) => void;
  className?: string;
};

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={7}
      onPress={onPress}
      className={cn(
        "rounded-full border px-3.5 py-[6px] active:opacity-90",
        selected ? "border-accent bg-accent" : "border-line bg-foreground",
      )}
    >
      <Text
        className={cn(
          "text-[12px] leading-[16px] font-medium",
          selected ? "text-on-accent" : "text-content",
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// "Spend by Category": a chip per category with its monthly spend, and the
// bubble chart of the subscriptions in the picked one.
export function SpendByCategory({ categories, bubbles, onOpen, className }: SpendByCategoryProps) {
  const [picked, setPicked] = useState<Filter>("All");
  // A category whose last subscription has gone falls back to All.
  const filter = categories.some((item) => item.category === picked) ? picked : "All";
  const shown = filter === "All" ? bubbles : bubbles.filter((bubble) => bubble.category === filter);

  return (
    <View className={className}>
      <Text className="text-[18px] leading-[24px] font-medium text-content">Spend by Category</Text>

      {/* Scrolls edge to edge, while the first chip lines up with the screen padding. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-screen mt-5"
        contentContainerClassName="gap-2 px-screen"
      >
        <Chip label="All" selected={filter === "All"} onPress={() => setPicked("All")} />
        {categories.map(({ category, total }) => (
          <Chip
            key={category}
            label={`${category} · ${total}`}
            selected={filter === category}
            onPress={() => setPicked(category)}
          />
        ))}
      </ScrollView>

      {/* 16 from the screen edges, 4 wider than the text, as in Figma. */}
      <View className="-mx-1 mt-4">
        <BubbleChart bubbles={shown} onPress={onOpen} />
      </View>
    </View>
  );
}
