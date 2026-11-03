import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "@/lib/cn";

type AccentTintProps = {
  // Size, shape and padding, e.g. "size-14 rounded-full".
  className?: string;
  children?: ReactNode;
};

// A soft orange fill: the accent at 16% behind the children. Tailwind's
// bg-accent/15 renders nothing on native with react-native-css 3.1.0-rc.0,
// so the tint is an accent layer with opacity under the content.
export function AccentTint({ className, children }: AccentTintProps) {
  return (
    <View className={cn("items-center justify-center overflow-hidden", className)}>
      <View className="absolute inset-0 bg-accent opacity-15" />
      {children}
    </View>
  );
}
