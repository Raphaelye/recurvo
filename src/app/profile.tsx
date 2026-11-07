import { useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { OfflineScreen } from "@/components/OfflineScreen";
import { ProfilePhotoSheet } from "@/components/ProfilePhotoSheet";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TextField } from "@/components/TextField";
import { useOffline } from "@/hooks/useOffline";
import { thrownErrorMessage } from "@/lib/clerk";
import { track } from "@/lib/posthog";
import { pickProfilePhoto } from "@/lib/profilePhoto";
import { nameError } from "@/lib/validation";

// Settings > Profile. First name, last name and photo are saved to Clerk, so Home
// and Settings show them too. The email is the sign-in address and can't change here.
export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { offline, checking, recheck } = useOffline();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const fullName = user?.fullName ?? email.split("@")[0];
  const firstNameError = nameError(firstName, "first");
  const lastNameError = nameError(lastName, "last");
  const changed =
    firstName.trim() !== (user?.firstName ?? "") || lastName.trim() !== (user?.lastName ?? "");
  const ready = changed && !firstNameError && !lastNameError;

  const save = async () => {
    if (!user || !ready) {
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await user.update({ firstName: firstName.trim(), lastName: lastName.trim() });
      track("profile_updated", { change: "name" });
      router.back();
    } catch (saveError) {
      setError(
        thrownErrorMessage(saveError) ??
          "We couldn’t save your changes. Check your connection and try again.",
      );
      setSaving(false);
    }
  };

  const changePhoto = async (action: "choose" | "remove") => {
    if (!user) {
      return;
    }
    setError(undefined);
    try {
      const photo = action === "choose" ? await pickProfilePhoto() : null;
      if (photo === undefined) {
        // Picker cancelled.
        return;
      }
      setPhotoBusy(true);
      await user.setProfileImage({ file: photo });
      await user.reload();
      track("profile_updated", { change: photo ? "photo" : "photo_removed" });
    } catch (photoError) {
      setError(thrownErrorMessage(photoError) ?? "We couldn’t update your photo. Please try again.");
    } finally {
      setPhotoBusy(false);
    }
  };

  // Name and photo are saved to Clerk, which needs the internet. Edits stay for when it is back.
  if (offline) {
    return <OfflineScreen title="Profile" checking={checking} onRetry={recheck} />;
  }

  return (
    <View className="flex-1 bg-main">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior="padding" className="flex-1">
          <ScreenHeader title="Profile" />

          <ScrollView
            className="flex-1"
            contentContainerClassName="gap-4 px-screen pb-4 pt-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="items-center">
              <View>
                <Avatar
                  name={fullName}
                  imageUrl={user?.hasImage ? user.imageUrl : undefined}
                  size="lg"
                />
                {/* Absolute: an overlay on the avatar while the photo uploads. */}
                {photoBusy && (
                  <View className="absolute inset-0 items-center justify-center rounded-full bg-overlay">
                    <ActivityIndicator className="text-on-accent" />
                  </View>
                )}
              </View>
              {/* py-1 and hitSlop give the 22px line a 46px touch area. */}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ busy: photoBusy }}
                hitSlop={8}
                disabled={photoBusy}
                onPress={() => setPhotoSheetOpen(true)}
                className="mt-3 py-1 active:opacity-70"
              >
                <Text className="link">Change photo</Text>
              </Pressable>
            </View>

            <TextField
              label="First name"
              labelClassName="field-label"
              value={firstName}
              onChangeText={setFirstName}
              error={firstNameError}
              autoCapitalize="words"
              autoComplete="given-name"
              textContentType="givenName"
            />
            <TextField
              label="Last name"
              labelClassName="field-label"
              value={lastName}
              onChangeText={setLastName}
              error={lastNameError}
              autoCapitalize="words"
              autoComplete="family-name"
              textContentType="familyName"
            />

            <View>
              <Text className="field-label">Email</Text>
              <View
                accessible
                accessibilityLabel={`Email, ${email}, can't be changed`}
                className="min-h-[54px] justify-center rounded-md bg-foreground p-4"
              >
                <Text numberOfLines={1} className="text-[16px] leading-[24px] font-normal text-muted">
                  {email}
                </Text>
              </View>
              <Text className="mt-2 text-[12px] leading-[16px] font-normal text-soft">
                Your email can’t be changed.
              </Text>
            </View>
          </ScrollView>

          <View className="px-screen pb-1.5 pt-4">
            {error && (
              <Text className="mb-3 text-center text-[13px] leading-[19px] font-normal text-destructive">
                {error}
              </Text>
            )}
            <Button label="Save Changes" onPress={save} disabled={!ready} loading={saving} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ProfilePhotoSheet
        visible={photoSheetOpen}
        hasPhoto={user?.hasImage ?? false}
        onAction={changePhoto}
        onClose={() => setPhotoSheetOpen(false)}
      />
    </View>
  );
}

// SafeAreaView can't take className (AGENTS.md), so it is styled here.
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
