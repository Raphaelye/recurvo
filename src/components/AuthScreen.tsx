import type { ReactNode } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants/images";

type AuthScreenProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  // Pinned to the bottom of the screen.
  footer: ReactNode;
};

// Shared layout of the sign-up, sign-in and verification screens.
export function AuthScreen({ title, subtitle, children, footer }: AuthScreenProps) {
  return (
    <View className="flex-1 bg-main">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <ScrollView
            className="flex-1"
            contentContainerClassName="grow px-screen-lg pb-1 pt-0.5"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row items-center gap-2.5">
              <Image source={images.logo} resizeMode="contain" className="size-10" />
              <Text className="text-[20px] leading-[28px] font-extrabold text-content">
                Recurvo
              </Text>
            </View>
            <Text className="mt-12 text-[30px] leading-[38px] font-bold text-content">
              {title}
            </Text>
            <Text className="mt-2 text-[15px] leading-[22px] font-normal text-muted">
              {subtitle}
            </Text>
            <View className="mt-6">{children}</View>
            <View className="mt-auto pt-6">{footer}</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

type AuthFooterLinkProps = {
  prompt: string;
  action: string;
  onPress: () => void;
};

// "New to Recurvo? Create account" style line at the bottom of an auth screen.
export function AuthFooterLink({ prompt, action, onPress }: AuthFooterLinkProps) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      <Text className="text-[15px] leading-[22px] font-normal text-muted">{prompt}</Text>
      <Pressable accessibilityRole="link" hitSlop={12} onPress={onPress}>
        <Text className="link">{action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
