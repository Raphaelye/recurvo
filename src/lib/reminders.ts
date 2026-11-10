import {
  cancelAllScheduledNotificationsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
} from "expo-notifications";

import { chargeAfterCancel, formatWeekdayDate, upcomingRenewal } from "@/lib/billing";
import { convertAmount, currencySymbol, formatAmount } from "@/lib/currency";
import {
  CANCEL_REMINDER_DAYS,
  ensureReminderChannel,
  getNotificationPermission,
  REMINDER_CHANNEL,
  REMINDER_DAYS,
} from "@/lib/notifications";
import type { Currency, ExchangeRates } from "@/types/currency";
import type { NotificationData } from "@/types/notifications";
import type { TrackedSubscription } from "@/types/subscription";

// Renewal and cancel reminders are local notifications, scheduled on the phone
// with no server. They follow the same rules as the Notifications page
// (hooks/useReminders.ts). The phone can only reschedule while the app runs, so
// each subscription gets its next few reminders ahead of time.

// Reminders go off at 9:00 on the phone's own clock.
const REMINDER_HOUR = 9;
// Next renewals scheduled per subscription, so reminders keep coming for a while
// even if the app isn't opened.
const RENEWALS_AHEAD = 3;
// iOS keeps at most 64 pending notifications. The soonest ones are kept.
const MAX_SCHEDULED = 60;

type PlannedReminder = {
  date: Date;
  title: string;
  body: string;
  data: NotificationData;
};

export type ReminderSettings = {
  subscriptions: TrackedSubscription[];
  // Settings' Notifications switch.
  enabled: boolean;
  preferred: Currency;
  rates?: ExchangeRates;
};

function reminderTime(charge: Date, daysBefore: number) {
  const date = new Date(charge);
  date.setDate(date.getDate() - daysBefore);
  date.setHours(REMINDER_HOUR, 0, 0, 0);
  return date;
}

// In the preferred currency, like the lists. Its own currency until rates load.
function amountText(subscription: TrackedSubscription, preferred: Currency, rates?: ExchangeRates) {
  const converted = convertAmount(subscription.amount, subscription.currency, preferred.code, rates);
  return converted === undefined
    ? formatAmount(subscription.amount, currencySymbol(subscription.currency))
    : formatAmount(converted, preferred.symbol);
}

function planFor(
  subscription: TrackedSubscription,
  amount: string,
  now: Date,
): PlannedReminder[] {
  const { id, name, nextRenewal, cycle, cancelledAt } = subscription;

  // Stopped: one reminder to cancel with the provider before its next charge.
  if (cancelledAt) {
    if (!subscription.cancelReminder) {
      return [];
    }
    const charge = chargeAfterCancel(nextRenewal, cycle, cancelledAt);
    const date = reminderTime(charge, CANCEL_REMINDER_DAYS);
    return date > now
      ? [
          {
            date,
            title: `Cancel ${name} before it charges`,
            body: `${amount} on ${formatWeekdayDate(charge.toISOString())} unless you cancel with ${name}`,
            data: { type: "cancel", subscriptionId: id },
          },
        ]
      : [];
  }

  // Statement imports without the setting count as on.
  if (subscription.remind === false) {
    return [];
  }
  const reminders: PlannedReminder[] = [];
  let from = now;
  // One more renewal than needed, as the soonest one's reminder may have passed.
  for (let count = 0; count <= RENEWALS_AHEAD && reminders.length < RENEWALS_AHEAD; count += 1) {
    const renewal = upcomingRenewal(nextRenewal, cycle, from);
    const date = reminderTime(renewal, REMINDER_DAYS);
    if (date > now) {
      reminders.push({
        date,
        title: `${name} renews in ${REMINDER_DAYS} days`,
        body: `${amount} on ${formatWeekdayDate(renewal.toISOString())}`,
        data: { type: "renewal", subscriptionId: id },
      });
    }
    from = new Date(renewal);
    from.setDate(from.getDate() + 1);
  }
  return reminders;
}

export function planReminders(
  { subscriptions, preferred, rates }: ReminderSettings,
  now = new Date(),
) {
  return subscriptions
    .flatMap((subscription) => planFor(subscription, amountText(subscription, preferred, rates), now))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, MAX_SCHEDULED);
}

async function replaceReminders(settings: ReminderSettings) {
  // Reminders are the only notifications the app schedules, so all of them go.
  await cancelAllScheduledNotificationsAsync();
  if (
    !settings.enabled ||
    settings.subscriptions.length === 0 ||
    (await getNotificationPermission()) !== "granted"
  ) {
    return;
  }
  await ensureReminderChannel();
  for (const reminder of planReminders(settings)) {
    await scheduleNotificationAsync({
      content: { title: reminder.title, body: reminder.body, data: reminder.data },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: reminder.date, channelId: REMINDER_CHANNEL },
    });
  }
}

let latest: Promise<void> = Promise.resolve();

// Replaces every scheduled reminder with ones for these settings. Runs one at a
// time, so two quick changes never leave a mix of both.
export function scheduleReminders(settings: ReminderSettings) {
  latest = latest.then(() => replaceReminders(settings)).catch(() => undefined);
  return latest;
}
