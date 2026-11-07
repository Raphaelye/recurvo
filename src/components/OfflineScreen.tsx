import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Illustration } from "@/components/Illustration";
import { ScreenHeader } from "@/components/ScreenHeader";

type OfflineScreenProps = {
  // The title of the screen it stands in for, when that screen has one.
  title?: string;
  // From useOffline: the "Try again" spinner and the recheck it runs.
  checking: boolean;
  onRetry: () => void;
  // A way forward that works offline, e.g. adding a subscription by hand.
  link?: { label: string; onPress: () => void };
};

// Stands in for a screen that needs the internet (sign-in, statement upload,
// profile, delete account) while the phone is offline. That screen comes back
// by itself when the connection does.
export function OfflineScreen({ title, checking, onRetry, link }: OfflineScreenProps) {
  return (
    <View className="flex-1 bg-main">
      <SafeAreaView style={styles.container}>
        <ScreenHeader title={title} />
        {/* Centred a little above the middle of the page, like the Notifications empty state. */}
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow justify-center px-screen pb-20 pt-5"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center">
            <Illustration name="noInternet" width={177} height={176} />
            <Text className="mt-2.5 text-center text-[20px] leading-[26px] font-medium text-content">
              No Internet Connection
            </Text>
            <Text className="mt-2 text-center text-[11px] leading-[14px] font-medium text-soft">
              Check your connection and try again.
            </Text>
          </View>

          <View className="px-4.5">
            <Button label="Try again" onPress={onRetry} loading={checking} className="mt-[51px]" />
            {link && (
              // py-1 and hitSlop give the 22px line a 46px touch area.
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={link.onPress}
                className="mt-2 self-center py-1 active:opacity-70"
              >
                <Text className="link">{link.label}</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// SafeAreaView can't take className (AGENTS.md), so it is styled here.
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
