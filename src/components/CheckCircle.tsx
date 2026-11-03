import { Tick02Icon } from "@hugeicons/core-free-icons";
import { View } from "react-native";

import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";

// Orange circle with a white tick. Set the size with className, e.g. size-6.
export function CheckCircle({ className }: { className?: string }) {
  return (
    <View className={cn("check-circle", className)}>
      <Icon icon={Tick02Icon} size={14} className="text-on-accent" />
    </View>
  );
}
