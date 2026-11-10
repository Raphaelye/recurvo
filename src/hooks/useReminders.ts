import { useSubscriptionItems } from "@/hooks/useSubscriptionItems";
import { useToday } from "@/hooks/useToday";
import { chargeAfterCancel, daysFromToday, daysUntil, formatWeekdayDate } from "@/lib/billing";
import { CANCEL_REMINDER_DAYS, REMINDER_DAYS } from "@/lib/notifications";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import type { Reminder } from "@/types/notifications";
import type { SubscriptionListItem } from "@/types/subscription";

type Due = { kind: Reminder["kind"]; item: SubscriptionListItem; daysLeft: number };

// Reminders for the Notifications page and Home's bell, soonest first:
// - tracked subscriptions with Remind me on, renewing within 3 days;
// - stopped ones with the cancel reminder on, whose next charge (the first after
//   stopping) is within 2 days and hasn't passed.
// The reminders scheduled on the phone (lib/reminders.ts) follow the same rules.
export function useReminders(): Reminder[] {
  const items = useSubscriptionItems();
  const saved = useSubscriptionStore((state) => state.subscriptions);
  const today = useToday();

  const due = items.flatMap((item): Due[] => {
    if (item.cancelledOn === undefined) {
      return item.remind && item.daysLeft <= REMINDER_DAYS
        ? [{ kind: "renewal", item, daysLeft: item.daysLeft }]
        : [];
    }
    const subscription = saved.find((candidate) => candidate.id === item.id);
    if (!subscription?.cancelledAt || !subscription.cancelReminder) {
      return [];
    }
    const charge = chargeAfterCancel(
      subscription.nextRenewal,
      subscription.cycle,
      subscription.cancelledAt,
    );
    const daysLeft = daysUntil(charge, today);
    return daysLeft >= 0 && daysLeft <= CANCEL_REMINDER_DAYS ? [{ kind: "cancel", item, daysLeft }] : [];
  });

  return due
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .map(({ kind, item, daysLeft }) => ({
      kind,
      id: item.id,
      name: item.name,
      amount: item.amount,
      daysLeft,
      day: formatWeekdayDate(daysFromToday(daysLeft, today)),
    }));
}
