import PostHog from "posthog-react-native";

// The only place that sends analytics (PostHog, EU cloud). Only release builds
// send events: development logs them to the console instead.
// Never pass amounts, merchant names, card digits or statement contents.
// Tap autocapture and session replay stay off: screens show amounts and names.

export type AnalyticsEvent =
  | "onboarding_beat_viewed"
  | "onboarding_get_started"
  | "account_created"
  | "statement_selected"
  | "scan_completed"
  | "subscriptions_confirmed"
  | "onboarding_completed"
  | "manual_fallback_used"
  | "subscription_added"
  | "subscription_edited"
  | "subscription_cancelled"
  | "subscription_restored"
  | "subscription_deleted"
  | "profile_updated"
  | "currency_changed"
  | "appearance_changed"
  | "notifications_changed"
  | "reminder_opened"
  | "review_opened"
  | "review_kept"
  | "cancel_reminder_changed"
  | "review_alerts_changed"
  | "app_lock_changed"
  | "data_exported"
  | "signed_out"
  | "account_deleted";

type EventProps = Record<string, string | number | boolean>;

// The project API key (phc_...) is public: it can only send events.
const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;

// Undefined in development, or when the key isn't set.
const posthog =
  !__DEV__ && apiKey
    ? new PostHog(apiKey, {
        host: "https://eu.i.posthog.com",
        // App opened, backgrounded, installed and updated.
        captureAppLifecycleEvents: true,
        enableSessionReplay: false,
        // Feature flags aren't used.
        preloadFeatureFlags: false,
      })
    : undefined;

export function track(event: AnalyticsEvent, props?: EventProps) {
  if (posthog) {
    posthog.capture(event, props);
  } else if (__DEV__) {
    console.log(`[analytics] ${event}`, props ?? {});
  }
}

// A route pattern such as "/subscription/[id]", never the id itself.
export function trackScreen(route: string) {
  if (posthog) {
    posthog.screen(route);
  } else if (__DEV__) {
    console.log(`[analytics] screen ${route}`);
  }
}

// Ties the events that follow to the Clerk user id. No email or name is sent.
export function identifyUser(userId: string) {
  posthog?.identify(userId);
}

// After sign-out or account deletion, so the next account starts fresh.
export function resetUser() {
  posthog?.reset();
}
