import "@/global.css";

import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { LaunchSplash } from "@/components/LaunchSplash";
import { fonts } from "@/constants/fonts";
import { clerkPublishableKey } from "@/lib/clerk";
import { clearStatementCache } from "@/lib/statementFiles";
import { useOnboardingStore } from "@/store/onboardingStore";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { useThemeStore } from "@/store/themeStore";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
        <RootNavigator />
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const [fontsLoaded, fontError] = useFonts(fonts);
  const [storesReady, setStoresReady] = useState(false);
  const [launchSplashVisible, setLaunchSplashVisible] = useState(true);
  const hydrateTheme = useThemeStore((state) => state.hydrate);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const hydrateOnboarding = useOnboardingStore((state) => state.hydrate);
  const hydrateSubscriptions = useSubscriptionStore((state) => state.hydrate);
  const setForcedDark = useThemeStore((state) => state.setForcedDark);
  const { isLoaded, isSignedIn } = useAuth();
  const signedIn = isSignedIn === true;

  useEffect(() => {
    // A statement left over from a scan the app never finished is deleted.
    clearStatementCache();
    Promise.all([
      hydrateTheme(),
      hydratePreferences(),
      hydrateOnboarding(),
      hydrateSubscriptions(),
    ]).finally(() => setStoresReady(true));
  }, [hydrateTheme, hydratePreferences, hydrateOnboarding, hydrateSubscriptions]);

  // Wait for Clerk too, so a signed-in user never sees the onboarding flash by.
  const ready = (fontsLoaded || fontError) && storesReady && isLoaded;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  const finishLaunchSplash = useCallback(() => {
    setForcedDark(false);
    setLaunchSplashVisible(false);
  }, [setForcedDark]);

  if (!ready) {
    return null;
  }

  if (launchSplashVisible) {
    return (
      <>
        <StatusBar style="light" />
        <LaunchSplash onDone={finishLaunchSplash} />
      </>
    );
  }

  // When the auth state changes, Expo Router leaves the screens that are no longer
  // allowed: signing in lands on home, signing out lands on onboarding.
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* redirectTo is needed: the default target is the anchor (index), which is the screen being hidden. */}
        <Stack.Protected guard={signedIn} redirectTo="/onboarding">
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
          <Stack.Screen name="setup" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn} redirectTo="/">
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
