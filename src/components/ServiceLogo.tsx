import { Image } from "expo-image";
import { styled } from "nativewind";

import { useTheme } from "@/hooks/useTheme";
import { logoUrl } from "@/lib/logoDev";

const StyledImage = styled(Image);

type ServiceLogoProps = {
  name: string;
  // Sets the size and shape, e.g. "size-4 rounded-full".
  className?: string;
};

// A service's Logo.dev logo. Each image is kept in the phone's memory and disk
// cache, so a logo is only fetched from the CDN once per phone and theme.
// Renders nothing until EXPO_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY is set.
export function ServiceLogo({ name, className }: ServiceLogoProps) {
  const { scheme } = useTheme();
  const uri = logoUrl(name, scheme);
  if (!uri) {
    return null;
  }

  return (
    <StyledImage
      source={{ uri }}
      cachePolicy="memory-disk"
      accessibilityIgnoresInvertColors
      className={className}
    />
  );
}
