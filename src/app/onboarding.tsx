import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "@/components/Icon";
import { OnboardingSlide } from "@/components/OnboardingSlide";
import { PageDots } from "@/components/PageDots";
import { onboardingSlides, type OnboardingSlide as Slide } from "@/data/onboarding";
import { useForcedDark } from "@/hooks/useTheme";

export default function Onboarding() {
  useForcedDark();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [height, setHeight] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const slide = onboardingSlides[index];
  const isLast = index === onboardingSlides.length - 1;

  const onSwipeEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const next = () => {
    if (isLast) {
      // Replace, so onboarding unmounts and gives the theme back to the user's preference.
      router.replace("/sign-up");
      return;
    }
    listRef.current?.scrollToOffset({ offset: (index + 1) * width });
    setIndex(index + 1);
  };

  return (
    <View className="flex-1 bg-main">
      <SafeAreaView style={styles.container}>
        {/* Only the pictures slide. */}
        <FlatList
          ref={listRef}
          data={onboardingSlides}
          keyExtractor={(slide) => slide.title}
          renderItem={({ item }) => (
            // Width and height depend on the screen, so they cannot be fixed classes.
            <View style={{ width, height }}>
              <OnboardingSlide slide={item} />
            </View>
          )}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
          onMomentumScrollEnd={onSwipeEnd}
          className="flex-1"
        />
        {/* Stays in place and shows the content for the current page. */}
        <View className="px-5">
          <PageDots count={onboardingSlides.length} index={index} />
          <Text className="mt-6 pr-5 text-[44px] leading-[50px] font-medium text-content">
            {slide.title}
          </Text>
          {/* Room for three lines, so the pictures keep the same height on every page. */}
          <Text className="mt-4 min-h-[60px] text-[15px] leading-[20px] font-medium text-muted">
            {slide.description}
          </Text>
        </View>
        <View className="mb-7 mr-10 mt-6 items-end">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isLast ? "Get started" : "Next"}
            className="arrow-button"
            onPress={next}
          >
            <Icon icon={ArrowRight02Icon} size={24} className="text-on-accent" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    
  },
});
