import { useAuth, useUser } from "@clerk/expo";
import { Alert02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { OfflineScreen } from "@/components/OfflineScreen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useOffline } from "@/hooks/useOffline";
import { useThemeColor } from "@/hooks/useThemeColor";
import { deleteLocalAccountData } from "@/lib/accountRepository";
import { thrownErrorMessage } from "@/lib/clerk";
import { track } from "@/lib/posthog";
import { useOnboardingStore } from "@/store/onboardingStore";

const CONFIRM_WORD = "DELETE";

const removedData = [
  "Your profile and sign-in details",
  "Saved cards and banks",
  "Subscriptions, billing cycles and Smart Review history",
  "Data read from your uploaded statements",
];

// Settings > Delete account. Typing DELETE is the confirm step. Clerk deletes the
// account and its session, then the data saved on this phone is deleted too.
export default function DeleteAccountScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const placeholderColor = useThemeColor("neutral");
  const pendingSetupFor = useOnboardingStore((state) => state.pendingSetupFor);
  const finishSetup = useOnboardingStore((state) => state.finishSetup);
  const { offline, checking, recheck } = useOffline();
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();
  const confirmed = typed.trim().toUpperCase() === CONFIRM_WORD;

  const deleteAccount = async () => {
    if (!user || !confirmed) {
      return;
    }
    const userId = user.id;
    setDeleting(true);
    setError(undefined);
    try {
      await user.delete();
    } catch (deleteError) {
      setError(
        thrownErrorMessage(deleteError) ??
          "We couldn’t delete your account. Check your connection and try again.",
      );
      setDeleting(false);
      return;
    }
    track("account_deleted");
    await deleteLocalAccountData(userId);
    if (pendingSetupFor === userId) {
      finishSetup();
    }
    // Deleting the account ends its session. Signing out as well makes sure the
    // app goes back to the welcome screen straight away.
    signOut().catch(() => undefined);
  };

  // Clerk deletes the account, which needs the internet.
  if (offline) {
    return <OfflineScreen title="Delete account" checking={checking} onRetry={recheck} />;
  }

  return (
    <View className="flex-1 bg-main">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <ScreenHeader title="Delete account" />

          <ScrollView
            className="flex-1"
            contentContainerClassName="px-screen pb-4 pt-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="rounded-xl bg-card px-4 py-3.5">
              <View className="flex-row items-center gap-3">
                <View className="icon-circle size-10">
                  <Icon icon={Alert02Icon} size={20} className="text-destructive" />
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] leading-[22px] font-bold text-content">
                    This can’t be undone
                  </Text>
                  <Text className="mt-0.5 text-[13px] leading-[19px] font-normal text-muted">
                    Deleting your account permanently removes:
                  </Text>
                </View>
              </View>
              <View className="mt-2.5 gap-[9px]">
                {removedData.map((item) => (
                  <View key={item} className="flex-row items-center gap-2.5 pl-1">
                    <View className="size-[5px] rounded-full bg-muted" />
                    <Text className="flex-1 text-[14px] leading-[18px] font-normal text-muted">
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="mt-4 flex-row items-start gap-3 rounded-xl bg-card p-3.5">
              <View className="icon-circle size-8">
                <Icon icon={InformationCircleIcon} size={16} className="text-content" />
              </View>
              <Text className="flex-1 text-[13px] leading-[19px] font-normal text-soft">
                Subscribed to Recurvo Pro? Deleting your account does not cancel it. Cancel in
                the App Store or Google Play first.
              </Text>
            </View>

            <Text className="field-label mt-3.5">Type DELETE to confirm</Text>
            <TextInput
              accessibilityLabel="Type DELETE to confirm"
              placeholder={CONFIRM_WORD}
              placeholderTextColor={placeholderColor}
              value={typed}
              onChangeText={setTyped}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              returnKeyType="done"
              className="input-field"
            />
          </ScrollView>

          <View className="px-screen pb-1.5 pt-4">
            {error && (
              <Text className="mb-3 text-center text-[13px] leading-[19px] font-normal text-destructive">
                {error}
              </Text>
            )}
            <Button
              label="Delete my account"
              onPress={deleteAccount}
              destructive
              disabled={!confirmed}
              loading={deleting}
            />
            {/* py-1 and hitSlop give the 22px line a 46px touch area. */}
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.back()}
              className="mt-2.5 self-center py-1 active:opacity-70"
            >
              <Text className="link-neutral">Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
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
