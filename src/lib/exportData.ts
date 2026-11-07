import { File, Paths } from "expo-file-system";
import { shareAsync } from "expo-sharing";

import type { TrackedSubscription } from "@/types/subscription";

// "Export my data": the account's subscriptions as a CSV file, handed to the
// share sheet (Save to Files, Mail…). The file goes to the user, never to
// analytics or logs, and is deleted once the share sheet closes.

const columns = [
  "Name",
  "Amount",
  "Currency",
  "Billing cycle",
  "Next renewal",
  "Card",
  "Card last 4",
  "Status",
  "Cancelled on",
];

// Quotes a value that contains a comma, quote or line break.
function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const day = (iso: string) => iso.slice(0, 10);

export function subscriptionsCsv(subscriptions: TrackedSubscription[]) {
  const rows = subscriptions.map((subscription) => [
    subscription.name,
    subscription.amount,
    subscription.currency,
    subscription.cycle,
    day(subscription.nextRenewal),
    subscription.card.name,
    subscription.card.last4,
    subscription.cancelledAt ? "Cancelled" : "Tracked",
    subscription.cancelledAt ? day(subscription.cancelledAt) : "",
  ]);
  return [columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export async function shareSubscriptionsCsv(subscriptions: TrackedSubscription[]) {
  const file = new File(Paths.cache, "recurvo-subscriptions.csv");
  file.create({ overwrite: true });
  try {
    await file.write(subscriptionsCsv(subscriptions));
    await shareAsync(file.uri, {
      mimeType: "text/csv",
      UTI: "public.comma-separated-values-text",
      dialogTitle: "Export my data",
    });
  } finally {
    if (file.exists) {
      file.delete();
    }
  }
}
