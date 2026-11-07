import { useToday } from "@/hooks/useToday";
import { monthlyAmount, startOfMonth } from "@/lib/billing";
import { convertAmount, formatAmount } from "@/lib/currency";
import { categoryOf } from "@/lib/services";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useRatesStore } from "@/store/ratesStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import type { CategorySpend, SpendBubble, SpendTrend } from "@/types/insights";
import type { ServiceCategory, TrackedSubscription } from "@/types/subscription";

// The figures on Insights, in the preferred currency. A subscription in another
// currency joins them once rates have loaded, as on Home.
export function useInsights() {
  const saved = useSubscriptionStore((state) => state.subscriptions);
  const preferred = usePreferencesStore((state) => state.currency);
  const rates = useRatesStore((state) => state.rates);
  const today = useToday();

  const monthlyOf = (subscription: TrackedSubscription) => {
    const amount = convertAmount(subscription.amount, subscription.currency, preferred.code, rates);
    return amount === undefined ? undefined : monthlyAmount(amount, subscription.cycle);
  };
  const sum = (list: TrackedSubscription[]) =>
    list.reduce((total, subscription) => total + (monthlyOf(subscription) ?? 0), 0);
  const format = (amount: number) => formatAmount(amount, preferred.symbol);

  const tracked = saved.filter((subscription) => !subscription.cancelledAt);
  const monthly = sum(tracked);

  // Last month: everything added before this month and not cancelled before it.
  // Statement imports have no addedAt, they were already being charged. Both
  // months use today's rates, so the change shows adds and cancels, not rates.
  const monthStart = startOfMonth(today);
  const lastMonth = sum(
    saved.filter(
      (subscription) =>
        (!subscription.addedAt || new Date(subscription.addedAt) < monthStart) &&
        (!subscription.cancelledAt || new Date(subscription.cancelledAt) >= monthStart),
    ),
  );
  const change = Math.round(monthly) - Math.round(lastMonth);
  const trend: SpendTrend = change > 0 ? "up" : change < 0 ? "down" : "same";
  const changeLabel =
    trend === "same"
      ? "Same as last month"
      : `${change > 0 ? "+" : "-"}${format(Math.abs(change))} vs last month`;

  // Bubbles for the tracked subscriptions whose cost is known, biggest first.
  const bubbles = tracked
    .map((subscription): SpendBubble | undefined => {
      const cost = monthlyOf(subscription);
      return cost === undefined
        ? undefined
        : {
            id: subscription.id,
            name: subscription.name,
            category: categoryOf(subscription.name),
            monthly: cost,
            label: format(cost),
          };
    })
    .filter((bubble) => bubble !== undefined)
    .sort((a, b) => b.monthly - a.monthly);

  // One chip per category with spend, A–Z.
  const totals = new Map<ServiceCategory, number>();
  bubbles.forEach((bubble) =>
    totals.set(bubble.category, (totals.get(bubble.category) ?? 0) + bubble.monthly),
  );
  const categories: CategorySpend[] = [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, total]) => ({ category, total: format(total) }));

  return {
    hasTracked: tracked.length > 0,
    monthly: format(monthly),
    trend,
    changeLabel,
    yearly: format(monthly * 12),
    // What the cancelled subscriptions would cost each month.
    saved: format(sum(saved.filter((subscription) => subscription.cancelledAt))),
    bubbles,
    categories,
  };
}
