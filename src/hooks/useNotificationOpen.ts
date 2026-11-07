import {
  clearLastNotificationResponse,
  DEFAULT_ACTION_IDENTIFIER,
  useLastNotificationResponse,
} from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";

import { readNotificationData } from "@/lib/notifications";
import { track } from "@/lib/posthog";
import { useSubscriptionStore } from "@/store/subscriptionStore";

// Opens the screen a tapped notification is about: a reminder opens the
// subscription's details, a Smart Review opens Insights. Covers a tap that starts
// the app (after the launch splash) and a tap while it runs.
// Used by the tabs layout, which only mounts once someone is signed in and Home
// is in place, so the details open on top of Home. With App lock on, the screen
// opens under the lock screen.
export function useNotificationOpen() {
  const response = useLastNotificationResponse();

  useEffect(() => {
    if (!response || response.actionIdentifier !== DEFAULT_ACTION_IDENTIFIER) {
      return;
    }
    // Handled once, even though the tabs layout mounts again after signing out and in.
    clearLastNotificationResponse();

    const data = readNotificationData(response.notification.request.content.data);
    if (!data) {
      return;
    }
    if (data.type === "review") {
      track("review_opened", { source: "push" });
      router.navigate("/insights");
      return;
    }

    track("reminder_opened", { source: "push", kind: data.type });
    // A deleted subscription, or one from another account on this phone, leaves Home open.
    const exists = useSubscriptionStore
      .getState()
      .subscriptions.some((subscription) => subscription.id === data.subscriptionId);
    if (exists) {
      router.push({ pathname: "/subscription/[id]", params: { id: data.subscriptionId } });
    }
  }, [response]);
}
