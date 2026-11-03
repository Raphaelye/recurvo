import type { IconSvgElement } from "@hugeicons/react-native";
import { Text, View } from "react-native";

import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";

type InlineNoteProps = {
  icon: IconSvgElement;
  text: string;
  className?: string;
};

export function InlineNote({ icon, text, className }: InlineNoteProps) {
  return (
    <View className={cn("inline-note", className)}>
      <Icon icon={icon} size={16} className="text-soft" />
      <Text className="flex-1 text-[12px] leading-[17px] font-normal text-soft">{text}</Text>
    </View>
  );
}
