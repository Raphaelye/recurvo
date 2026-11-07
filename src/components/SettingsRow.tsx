import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";

type SettingsRowProps = {
  title: string;
  // Weight and colour of the title. Medium content by default.
  titleClassName?: string;
  // A line of text under the title, e.g. the account's email.
  subtitle?: string;
  // Shown before the title, e.g. the avatar.
  leading?: ReactNode;
  // Muted text before the chevron, e.g. "System".
  value?: string;
  chevron?: boolean;
  // A control at the end of the row, e.g. a toggle.
  trailing?: ReactNode;
  // Without it the row is not pressable.
  onPress?: () => void;
  accessibilityLabel?: string;
  className?: string;
};

// One row in a settings group. Rows have no vertical padding: the group spaces
// them, and hitSlop gives the one-line rows a 44px touch area.
export function SettingsRow({
  title,
  titleClassName = "font-medium text-content",
  subtitle,
  leading,
  value,
  chevron = false,
  trailing,
  onPress,
  accessibilityLabel,
  className,
}: SettingsRowProps) {
  const content = (
    <>
      {leading}
      <View className="flex-1">
        <Text numberOfLines={1} className={cn("text-[15px] leading-[20px]", titleClassName)}>
          {title}
        </Text>
        {subtitle && (
          <Text
            numberOfLines={1}
            className="mt-1 text-[12px] leading-[16px] font-normal text-muted"
          >
            {subtitle}
          </Text>
        )}
      </View>
      {value && (
        <Text className="text-[13px] leading-[19px] font-normal text-muted">{value}</Text>
      )}
      {trailing}
      {chevron && <Icon icon={ArrowRight01Icon} size={20} className="text-muted" />}
    </>
  );

  const rowClassName = cn("settings-row", className);

  if (!onPress) {
    return <View className={rowClassName}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (value ? `${title}, ${value}` : title)}
      hitSlop={{ top: 12, bottom: 12 }}
      onPress={onPress}
      className={cn(rowClassName, "active:opacity-90")}
    >
      {content}
    </Pressable>
  );
}
