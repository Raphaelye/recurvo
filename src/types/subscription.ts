import type { BillingCycle, PaymentCard } from "@/types/setup";

export type TrackedSubscription = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  cycle: BillingCycle;
  // ISO date. Later renewals are projected from it and the cycle.
  nextRenewal: string;
  // Only the card name, last 4 digits and type, never the full number.
  card: PaymentCard;
  // Send a reminder 3 days before renewal. Not set on statement imports yet:
  // the notifications feature decides their default.
  remind?: boolean;
  // ISO date the user cancelled it. A cancelled subscription is only listed under
  // the Subscriptions tab's Cancelled, until the user continues tracking it.
  cancelledAt?: string;
  // Remind the user to cancel with the provider 2 days before the next charge,
  // after they stopped tracking it (the "removed" screen's switch).
  cancelReminder?: boolean;
  // ISO date it was added by hand, for Insights' "vs last month". Statement imports
  // have none: they were already being charged, so they count as last month's too.
  addedAt?: string;
  // A foreign-currency subscription's exchange rate when it was added, for the
  // "up ₦400 since you started" review. `rate` is one unit of its currency in `currency`.
  startRate?: { currency: string; rate: number };
};

// Fields to change on a saved subscription. A field set to undefined is removed.
export type SubscriptionChanges = Partial<Omit<TrackedSubscription, "id">>;

export type ServiceCategory =
  | "Entertainment"
  | "Productivity"
  | "Design"
  | "Storage"
  | "Education"
  | "Internet"
  | "Other";

// A tracked subscription ready to show in a card or row.
export type SubscriptionListItem = {
  id: string;
  name: string;
  // Per charge, formatted in the preferred currency (its own currency until rates load).
  amount: string;
  cycle: BillingCycle;
  category: ServiceCategory;
  // Calendar days until the next renewal, 0 on the day.
  daysLeft: number;
  // The next renewal, e.g. "26 Jun 2026".
  renewsOn: string;
  // The day the user cancelled it, e.g. "5 Nov 2026". Undefined while it is tracked.
  cancelledOn?: string;
  card: PaymentCard;
  // Remind me. Statement imports have no setting yet and count as on.
  remind: boolean;
};
