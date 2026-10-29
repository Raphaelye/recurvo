import "@/global.css";

import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";

import { fonts } from "@/constants/fonts";
import { clerkPublishableKey } from "@/lib/clerk";
import { useThemeStore } from "@/store/themeStore";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <RootNavigator />
    </ClerkProvider>
  );
}

function RootNavigator() {
  const [fontsLoaded, fontError] = useFonts(fonts);
  const [themeReady, setThemeReady] = useState(false);
  const hydrateTheme = useThemeStore((state) => state.hydrate);
  const { isLoaded, isSignedIn } = useAuth();
  const signedIn = isSignedIn === true;

  useEffect(() => {
    hydrateTheme().finally(() => setThemeReady(true));
  }, [hydrateTheme]);

  // Wait for Clerk too, so a signed-in user never sees the onboarding flash by.
  const ready = (fontsLoaded || fontError) && themeReady && isLoaded;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
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
        </Stack.Protected>
        <Stack.Protected guard={!signedIn} redirectTo="/">
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}
