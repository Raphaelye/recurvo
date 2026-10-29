import { Image, View } from "react-native";

import type { OnboardingSlide as Slide } from "@/data/onboarding";

// One sliding picture, fading into the background at the bottom.
export function OnboardingSlide({ slide }: { slide: Slide }) {
  return (
    <View className="flex-1 overflow-hidden">
      <Image
        source={slide.image}
        resizeMode={slide.resizeMode}
        className={slide.imageClassName}
      />
      <View
        className="absolute inset-x-0 bottom-0 h-[110px] bg-linear-to-b from-transparent to-main"
        pointerEvents="none"
      />
    </View>
  );
}
