import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { Icon } from "@/components/Icon";

// Back button and page title, at the top of pushed screens (Add Subscription,
// Notifications, Appearance, Profile, Delete account) and the offline state.
// The offline state can leave out the title, and can stand in for the first
// screen of the stack, where there is nothing to go back to.
export function ScreenHeader({ title }: { title?: string }) {
  const router = useRouter();

  return (
    <View className="min-h-10 flex-row items-center gap-4 px-screen pt-0.5">
      {router.canGoBack() && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={2}
          onPress={() => router.back()}
          className="icon-button active:opacity-90"
        >
          <Icon icon={ArrowLeft01Icon} size={20} className="text-content" />
        </Pressable>
      )}
      {title && (
        <Text
          accessibilityRole="header"
          className="flex-1 text-[22px] leading-[28px] font-semibold text-content"
        >
          {title}
        </Text>
      )}
    </View>
  );
}
