import { useSubscriptionItems } from "@/hooks/useSubscriptionItems";
import { monthlyAmount } from "@/lib/billing";
import { convertAmount, formatAmount } from "@/lib/currency";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useRatesStore } from "@/store/ratesStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";

// Renewals due within this many days show in Home's swipeable row.
const UPCOMING_DAYS = 7;
// Home lists the latest additions. View All shows the rest.
const LATEST_COUNT = 3;

// Everything Home shows about the tracked subscriptions, in the preferred currency.
// Cancelled ones are left out: they are only listed under the Subscriptions tab.
export function useHomeSummary() {
  const saved = useSubscriptionStore((state) => state.subscriptions);
  const preferred = usePreferencesStore((state) => state.currency);
  const rates = useRatesStore((state) => state.rates);
  const subscriptions = saved.filter((subscription) => !subscription.cancelledAt);
  const items = useSubscriptionItems().filter((item) => item.cancelledOn === undefined);

  // Monthly cost. A subscription in another currency joins once rates have loaded.
  const total = subscriptions.reduce((sum, subscription) => {
    const amount = convertAmount(subscription.amount, subscription.currency, preferred.code, rates);
    return amount === undefined ? sum : sum + monthlyAmount(amount, subscription.cycle);
  }, 0);

  return {
    count: subscriptions.length,
    total: formatAmount(total, preferred.symbol),
    upcoming: items
      .filter((item) => item.daysLeft <= UPCOMING_DAYS)
      .sort((a, b) => a.daysLeft - b.daysLeft),
    latest: items.slice(0, LATEST_COUNT),
  };
}
