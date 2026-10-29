import { ActivityIndicator, Pressable, Text } from "react-native";

import { cn } from "@/lib/cn";

type ButtonProps = {
  label: string;
  onPress: () => void;
  // Shows a spinner in place of the label and ignores presses, without fading the button.
  loading?: boolean;
  disabled?: boolean;
  className?: string;
};

export function Button({ label, onPress, loading = false, disabled = false, className }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: loading, disabled }}
      disabled={disabled}
      onPress={loading ? undefined : onPress}
      className={cn("btn-primary", className)}
    >
      {loading ? (
        <ActivityIndicator className="text-on-accent" />
      ) : (
        <Text className="btn-label">{label}</Text>
      )}
    </Pressable>
  );
}
