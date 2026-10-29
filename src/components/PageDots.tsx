import { View } from "react-native";

import { cn } from "@/lib/cn";

type PageDotsProps = { count: number; index: number };

// The active page is a wider orange pill, the others are small gray dots.
export function PageDots({ count, index }: PageDotsProps) {
  return (
    // ml-1: the design insets the dots 4px from the text below them.
    <View
      className="ml-1 flex-row gap-1.5 transition"
      accessibilityLabel={`Page ${index + 1} of ${count}`}
    >
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          className={cn(
            "h-2.5 rounded-full",
            i === index ? "w-5 bg-accent" : "w-2.5 bg-muted",
          )}
        />
      ))}
    </View>
  );
}
