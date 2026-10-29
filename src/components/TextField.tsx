import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";

import { Icon } from "@/components/Icon";
import { useThemeColor } from "@/hooks/useThemeColor";
import { cn } from "@/lib/cn";

type TextFieldProps = Omit<TextInputProps, "className" | "secureTextEntry"> & {
  label: string;
  error?: string;
  // Hides the text and adds a show/hide eye button.
  password?: boolean;
};

export function TextField({ label, error, password = false, ...inputProps }: TextFieldProps) {
  const [hidden, setHidden] = useState(true);
  const placeholderColor = useThemeColor("neutral");

  return (
    <View>
      <Text className="input-label">{label}</Text>
      <View>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={placeholderColor}
          secureTextEntry={password && hidden}
          className={cn(
            password ? "input-field-password" : "input-field",
            error && "input-border-error",
          )}
          {...inputProps}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
            hitSlop={12}
            onPress={() => setHidden(!hidden)}
            className="absolute inset-y-0 right-4 justify-center"
          >
            <Icon
              icon={hidden ? ViewIcon : ViewOffSlashIcon}
              size={20}
              className="text-neutral"
            />
          </Pressable>
        )}
      </View>
      {error && <Text className="input-error">{error}</Text>}
    </View>
  );
}
