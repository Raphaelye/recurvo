import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { usePathname, useRouter } from "expo-router";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { flowSteps } from "@/data/setup";

type FlowScreenProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  // Pinned to the bottom of the screen. Usually a FlowFooter.
  footer?: ReactNode;
  // Replaces going back, e.g. to leave the email code step.
  onBack?: () => void;
};

// Layout of Create account, the setup steps and Reset password: back button,
// step bar, title, subtitle, content and a pinned footer. The step bar shows
// when the route is one of the numbered steps in data/setup.ts.
export function FlowScreen({ title, subtitle, children, footer, onBack }: FlowScreenProps) {
  const router = useRouter();
  const route = usePathname().split("/").pop();
  const step = flowSteps.findIndex((name) => name === route) + 1;
  const canGoBack = onBack !== undefined || router.canGoBack();

  return (
    <View className="flex-1 bg-main">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <View className="min-h-10 flex-row items-center gap-4 px-screen pt-0.5">
            {canGoBack && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                hitSlop={2}
                onPress={onBack ?? (() => router.back())}
                className="size-10 items-center justify-center rounded-full bg-foreground active:opacity-90"
              >
                <Icon icon={ArrowLeft01Icon} size={20} className="text-content" />
              </Pressable>
            )}
            {step > 0 && (
              <View
                accessibilityLabel={`Step ${step} of ${flowSteps.length}`}
                className="flex-1 flex-row gap-1.5"
              >
                {flowSteps.map((name, index) => (
                  <View
                    key={name}
                    className={index < step ? "progress-step-active" : "progress-step"}
                  />
                ))}
              </View>
            )}
          </View>
          <ScrollView
            className="flex-1"
            contentContainerClassName="grow px-screen pb-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text className="mt-6.5 text-[30px] leading-[38px] font-bold text-content">{title}</Text>
            <Text className="mt-2 text-[15px] leading-[22px] font-normal text-muted">{subtitle}</Text>
            <View className="mt-5 grow">{children}</View>
          </ScrollView>
          {footer}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

type FlowFooterProps = {
  button?: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean };
  // A neutral text link under the button.
  link?: { label: string; onPress: () => void };
  children?: ReactNode;
};

// Pinned primary button with an optional text link under it.
export function FlowFooter({ button, link, children }: FlowFooterProps) {
  return (
    <View className="gap-1 px-screen pb-2 pt-4">
      {children}
      {button && (
        <Button
          label={button.label}
          onPress={button.onPress}
          disabled={button.disabled}
          loading={button.loading}
        />
      )}
      {link && (
        // py-1 and hitSlop give the 22px line a 46px touch area.
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={link.onPress}
          className="self-center py-1 active:opacity-70"
        >
          <Text className="link-neutral">{link.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
