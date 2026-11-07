import type { ReactNode } from "react";
import { Text, View } from "react-native";

type SettingsGroupProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

// A section label over a card of settings rows, 29 apart.
export function SettingsGroup({ label, children, className }: SettingsGroupProps) {
  return (
    <View className={className}>
      <Text accessibilityRole="header" className="section-label">
        {label}
      </Text>
      <View className="settings-group gap-[29px]">{children}</View>
    </View>
  );
}
