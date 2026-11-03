// The only place that sends analytics. PostHog is not installed yet, so events
// are logged in development and dropped in production builds.
// Never pass amounts, merchant names, card digits or statement contents.

export type AnalyticsEvent =
  | "onboarding_beat_viewed"
  | "onboarding_get_started"
  | "account_created"
  | "statement_selected"
  | "scan_completed"
  | "subscriptions_confirmed"
  | "onboarding_completed"
  | "manual_fallback_used";

type EventProps = Record<string, string | number | boolean>;

export function track(event: AnalyticsEvent, props?: EventProps) {
  if (__DEV__) {
    console.log(`[analytics] ${event}`, props ?? {});
  }
}
