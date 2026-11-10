import { useEffect } from "react";
import { AppState } from "react-native";

import { scheduleReminders } from "@/lib/reminders";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useRatesStore } from "@/store/ratesStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";

// Keeps the phone's scheduled reminders in step with the signed-in account:
// after any change to its subscriptions, the Notifications switch, the currency
// or the rates, and on coming back to the foreground (which picks up permission
// given in the phone's Settings). Signed out, the list is empty, so every
// reminder is cancelled. Used once, by the root layout.
export function useReminderSchedule() {
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const enabled = usePreferencesStore((state) => state.notifications.enabled);
  const preferred = usePreferencesStore((state) => state.currency);
  const rates = useRatesStore((state) => state.rates);

  useEffect(() => {
    const schedule = () => scheduleReminders({ subscriptions, enabled, preferred, rates });
    schedule();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        schedule();
      }
    });
    return () => subscription.remove();
  }, [subscriptions, enabled, preferred, rates]);
}
