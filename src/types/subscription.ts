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
};
