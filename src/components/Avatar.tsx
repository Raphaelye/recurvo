import { Image, Text, View } from "react-native";

import { cn } from "@/lib/cn";

type AvatarProps = {
  name: string;
  // The user's profile photo. Without one, the initials are shown.
  imageUrl?: string;
  // "md": 50px (Home, Settings). "lg": 88px (Profile).
  size?: "md" | "lg";
};

// Up to two initials: "Clever Raph" gives "CR". The email fallback "cleverraph" gives "C".
function initials(name: string) {
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function Avatar({ name, imageUrl, size = "md" }: AvatarProps) {
  const sizeClass = size === "lg" ? "size-[88px]" : "size-[50px]";

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        accessibilityIgnoresInvertColors
        className={cn(sizeClass, "rounded-full")}
      />
    );
  }

  return (
    <View className={cn(sizeClass, "items-center justify-center rounded-full bg-content")}>
      <Text
        className={cn(
          "font-bold text-main",
          size === "lg" ? "text-[30px] leading-[38px]" : "text-[18px] leading-[24px]",
        )}
      >
        {initials(name)}
      </Text>
    </View>
  );
}
