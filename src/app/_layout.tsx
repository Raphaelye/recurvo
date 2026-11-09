import "@/global.css";

import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AppLockGate } from "@/components/AppLockGate";
import { LaunchSplash } from "@/components/LaunchSplash";
import { fonts } from "@/constants/fonts";
import { deleteLocalAccountData } from "@/lib/accountRepository";
import { clerkPublishableKey } from "@/lib/clerk";
import { registerPushToken, showNotificationsWhileOpen } from "@/lib/notifications";
import { clearStatementCache } from "@/lib/statementFiles";
import { useAppLockStore } from "@/store/appLockStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useRatesStore } from "@/store/ratesStore";
import { useReviewStore } from "@/store/reviewStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import { useThemeStore } from "@/store/themeStore";

SplashScreen.preventAutoHideAsync();
showNotificationsWhileOpen();

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
  const hydrateReviews = useReviewStore((state) => state.hydrate);
  const hydrateRates = useRatesStore((state) => state.hydrate);
  const hydrateAppLock = useAppLockStore((state) => state.hydrate);
  const refreshSubscriptions = useSubscriptionStore((state) => state.refresh);
  const refreshPreferences = usePreferencesStore((state) => state.refresh);
  const refreshReviews = useReviewStore((state) => state.refresh);
  const unlockApp = useAppLockStore((state) => state.unlock);
  const setForcedDark = useThemeStore((state) => state.setForcedDark);
  const { isLoaded, isSignedIn, userId } = useAuth();
  // The account whose data is in the stores (null when signed out).
  // Undefined until Clerk has loaded and that first load has finished.
  const [accountLoadedFor, setAccountLoadedFor] = useState<string | null>();
  // A new sign-in stays on the auth screen until its data has loaded, so Home
  // never flashes empty.
  const signedIn = isSignedIn === true && accountLoadedFor === userId;
  // The account signed in before, whose copy goes when it signs out.
  const previousAccount = useRef<string>(undefined);

  // Data that belongs to the phone, read once.
  useEffect(() => {
    // A statement left over from a scan the app never finished is deleted.
    clearStatementCache();
    Promise.all([
      hydrateTheme(),
      hydrateOnboarding(),
      // Only reads the saved rates. The daily refresh runs in the background.
      hydrateRates(),
      hydrateAppLock(),
    ]).finally(() => setStoresReady(true));
  }, [hydrateTheme, hydrateOnboarding, hydrateRates, hydrateAppLock]);

  // Data that belongs to the account, read again whenever someone signs in or out.
  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    const account = userId ?? undefined;
    // Signing out deletes the copy of that account's data from the phone.
    // Supabase keeps it for the next sign-in.
    const previous = previousAccount.current;
    if (previous && previous !== account) {
      deleteLocalAccountData(previous).catch(() => undefined);
    }
    previousAccount.current = account;
    let current = true;
    Promise.all([
      hydrateSubscriptions(account),
      hydratePreferences(account),
      hydrateReviews(account),
    ]).finally(() => {
      // A later sign-in or sign-out has taken over.
      if (current) {
        setAccountLoadedFor(account ?? null);
      }
    });
    return () => {
      current = false;
    };
  }, [isLoaded, userId, hydrateSubscriptions, hydratePreferences, hydrateReviews]);

  // Picks up changes made on another phone, or missed while offline.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refreshSubscriptions();
        refreshPreferences();
        refreshReviews();
      }
    });
    return () => subscription.remove();
  }, [refreshSubscriptions, refreshPreferences, refreshReviews]);

  // Saves this phone's push token for reminders and Smart Reviews: on launch,
  // after sign-in, and on coming back to the foreground until it has been saved
  // (e.g. after allowing notifications in the phone's Settings).
  useEffect(() => {
    if (!signedIn || !userId) {
      return;
    }
    registerPushToken(userId);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        registerPushToken(userId);
      }
    });
    return () => subscription.remove();
  }, [signedIn, userId]);

  // App lock only guards a signed-in app. Signing in already proves who it is,
  // so a sign-in after a sign-out doesn't ask again. Waits for the saved setting,
  // which starts the app locked.
  useEffect(() => {
    if (storesReady && isLoaded && !isSignedIn) {
      unlockApp();
    }
  }, [storesReady, isLoaded, isSignedIn, unlockApp]);

  // Launch waits for Clerk and the first account load, so a signed-in user never
  // sees the onboarding or an empty Home flash by. Later sign-ins don't wait.
  const ready = (fontsLoaded || fontError) && storesReady && accountLoadedFor !== undefined;

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
          <Stack.Screen name="add-subscription" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="appearance" />
          <Stack.Screen name="delete-account" />
          {/* Transparent, so the screen underneath shows through the blurred backdrop. */}
          <Stack.Screen
            name="subscription/[id]"
            options={{ presentation: "transparentModal", animation: "fade" }}
          />
          {/* After Stop tracking. Fades in over the sheet's screen. */}
          <Stack.Screen name="removed/[id]" options={{ animation: "fade" }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn} redirectTo="/">
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
        </Stack.Protected>
      </Stack>
      {signedIn && <AppLockGate />}
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
