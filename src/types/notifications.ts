export type ReviewFrequency = "Weekly" | "Monthly" | "Off";

// What the account wants to be notified about. Supabase reads these when it sends
// reminders and AI reviews; the phone's own permission is checked separately.
export type NotificationPreferences = {
  // Settings' Notifications switch. Off stops every notification for the account.
  enabled: boolean;
  // How often the AI smart review is sent.
  reviewAlerts: ReviewFrequency;
};

// The data every push carries, set by the Supabase function that sends it. The app
// picks the screen from the type: a reminder opens the subscription's details, a
// Smart Review opens Insights. Pushes with any other data open the app as it is.
export type NotificationData =
  | { type: "renewal" | "cancel"; subscriptionId: string }
  | { type: "review" };

// A reminder on the Notifications page. "renewal": a tracked subscription renews
// soon. "cancel": one the user stopped tracking charges soon, unless they cancel
// it with the provider.
export type Reminder = {
  kind: "renewal" | "cancel";
  // The subscription's id, for opening its details.
  id: string;
  name: string;
  // Per charge, in the preferred currency.
  amount: string;
  // Calendar days until the renewal, 0 on the day.
  daysLeft: number;
  // The renewal day, e.g. "Mon, 9 Nov".
  day: string;
};
