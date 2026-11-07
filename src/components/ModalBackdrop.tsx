import { BlurView } from "expo-blur";
import { styled } from "nativewind";
import { Platform, Pressable } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/cn";

const StyledBlurView = styled(BlurView);

type ModalBackdropProps = {
  onPress: () => void;
};

// Fills the screen behind a centred modal. Tapping it closes the modal.
// iOS blurs the screen underneath. Android draws blur poorly, so it gets a solid fill.
export function ModalBackdrop({ onPress }: ModalBackdropProps) {
  const { scheme } = useTheme();
  const blur = Platform.OS === "ios";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Close"
      onPress={onPress}
      className={cn("absolute inset-0", !blur && "bg-main")}
    >
      {blur && <StyledBlurView tint={scheme} intensity={70} className="flex-1" />}
    </Pressable>
  );
}
