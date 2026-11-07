import { useToday } from "@/hooks/useToday";
import { daysUntil, formatDate, upcomingRenewal } from "@/lib/billing";
import { convertAmount, currencySymbol, formatAmount } from "@/lib/currency";
import { categoryOf } from "@/lib/services";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useRatesStore } from "@/store/ratesStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import type { SubscriptionListItem } from "@/types/subscription";

// Every saved subscription ready for a card or row, newest first,
// with amounts in the preferred currency.
export function useSubscriptionItems() {
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const preferred = usePreferencesStore((state) => state.currency);
  const rates = useRatesStore((state) => state.rates);
  const today = useToday();

  const items = subscriptions.map((subscription): SubscriptionListItem => {
    // Its own currency until rates have loaded.
    const amount = convertAmount(subscription.amount, subscription.currency, preferred.code, rates);
    const renewal = upcomingRenewal(subscription.nextRenewal, subscription.cycle, today);
    return {
      id: subscription.id,
      name: subscription.name,
      amount:
        amount === undefined
          ? formatAmount(subscription.amount, currencySymbol(subscription.currency))
          : formatAmount(amount, preferred.symbol),
      cycle: subscription.cycle,
      category: categoryOf(subscription.name),
      daysLeft: daysUntil(renewal, today),
      renewsOn: formatDate(renewal.toISOString()),
      cancelledOn: subscription.cancelledAt ? formatDate(subscription.cancelledAt) : undefined,
      card: subscription.card,
      remind: subscription.remind !== false,
    };
  });

  // Saved in the order they were added, so the newest are at the end.
  return items.reverse();
}
