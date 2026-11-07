import { findCurrency } from "@/lib/currency";
import { readUserItem, writeUserItem } from "@/lib/storage";
import type { Currency } from "@/types/currency";

const KEY = "preferred-currency";

// The currency picked on Create account, saved per account. Totals and converted
// amounts show in it.
export async function loadPreferredCurrency(userId: string): Promise<Currency | undefined> {
  return findCurrency(await readUserItem(KEY, userId));
}

export function savePreferredCurrency(userId: string, currency: Currency) {
  return writeUserItem(KEY, userId, currency.code);
}
