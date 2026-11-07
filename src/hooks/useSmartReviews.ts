import { monthlyAmount, perCycle } from "@/lib/billing";
import {
  convertAmount,
  currencyPlural,
  currencySymbol,
  formatAmount,
  formatPrice,
} from "@/lib/currency";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useRatesStore } from "@/store/ratesStore";
import { useReviewStore } from "@/store/reviewStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import type { SmartReview } from "@/types/insights";
import type { TrackedSubscription } from "@/types/subscription";

// "about half", for a share of the monthly spend.
function shareOf(fraction: number) {
  if (fraction >= 0.9) return "almost all";
  if (fraction >= 0.7) return "about three quarters";
  if (fraction >= 0.6) return "about two thirds";
  if (fraction >= 0.4) return "about half";
  if (fraction >= 0.3) return "about a third";
  if (fraction >= 0.2) return "about a quarter";
  return `${Math.round(fraction * 100)}%`;
}

// The Smart Review cards, minus the ones answered with Keep. Built on the phone
// from two rules for now: the most expensive subscription, and each one billed
// in another currency. When the OpenAI Edge Function sends reviews, only this
// hook changes.
export function useSmartReviews(): SmartReview[] {
  const saved = useSubscriptionStore((state) => state.subscriptions);
  const preferred = usePreferencesStore((state) => state.currency);
  const rates = useRatesStore((state) => state.rates);
  const kept = useReviewStore((state) => state.kept);

  // Each tracked subscription with its charge in the preferred currency.
  // One in another currency is left out until rates have loaded.
  const priced = saved
    .filter((subscription) => !subscription.cancelledAt)
    .map((subscription) => ({
      subscription,
      charge: convertAmount(subscription.amount, subscription.currency, preferred.code, rates),
    }))
    .filter(
      (item): item is { subscription: TrackedSubscription; charge: number } =>
        item.charge !== undefined,
    )
    .map((item) => ({ ...item, monthly: monthlyAmount(item.charge, item.subscription.cycle) }))
    .sort((a, b) => b.monthly - a.monthly);

  const total = priced.reduce((sum, item) => sum + item.monthly, 0);
  const reviews: SmartReview[] = [];

  // With one subscription, "most expensive" says nothing.
  const top = priced[0];
  if (priced.length > 1 && top) {
    const { name, cycle } = top.subscription;
    reviews.push({
      id: `most-expensive:${top.subscription.id}`,
      kind: "most_expensive",
      subscriptionId: top.subscription.id,
      title: `${name} is your most expensive subscription`,
      message: `${formatAmount(top.charge, preferred.symbol)} ${perCycle(cycle)}, ${shareOf(top.monthly / total)} of what you spend. Do you still need it?`,
    });
  }

  priced
    .filter((item) => item.subscription.currency !== preferred.code)
    .forEach(({ subscription, charge }) => {
      const { id, name, amount, currency, cycle, startRate } = subscription;
      // How much the same charge has moved with the rate since it was added. Only
      // known when it was added in the current preferred currency.
      const change =
        startRate?.currency === preferred.code
          ? Math.round(charge - amount * startRate.rate)
          : 0;
      const since =
        change === 0
          ? ""
          : `, ${change > 0 ? "up" : "down"} ${formatAmount(Math.abs(change), preferred.symbol)} since you started`;
      reviews.push({
        id: `foreign-currency:${id}`,
        kind: "foreign_currency",
        subscriptionId: id,
        title: `${name} is billed in ${currencyPlural(currency)}`,
        message: `${formatPrice(amount, currencySymbol(currency))} ${perCycle(cycle)} costs ${formatAmount(charge, preferred.symbol)} today${since}. Keep it?`,
      });
    });

  return reviews.filter((review) => !kept.includes(review.id));
}
