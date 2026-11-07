import { currencies } from "@/data/currencies";
import { readItem, writeItem } from "@/lib/storage";
import type { ExchangeRates } from "@/types/currency";

const KEY = "exchangeRates";
const BASE = "USD";

// Frankfurter: free central bank rates, no API key, so it is safe to call from the app.
// A scheduled Supabase function replaces this fetch once the backend is built.
const RATES_URL = "https://api.frankfurter.dev/v2/rates";

// One row per quoted currency.
type FrankfurterRate = {
  quote: string;
  rate: number;
};

// The rates saved on the phone by the last fetch.
export async function loadRates(): Promise<ExchangeRates | undefined> {
  const value = await readItem(KEY);
  return value ? (JSON.parse(value) as ExchangeRates) : undefined;
}

// Today's rates for every currency the app offers, saved on the phone for the next launch.
export async function fetchRates(): Promise<ExchangeRates> {
  const quotes = currencies
    .map((currency) => currency.code)
    .filter((code) => code !== BASE)
    .join(",");
  const response = await fetch(`${RATES_URL}?base=${BASE}&quotes=${quotes}`);
  if (!response.ok) {
    throw new Error(`Exchange rates request failed with ${response.status}`);
  }

  const rows = (await response.json()) as FrankfurterRate[];
  const rates: Record<string, number> = { [BASE]: 1 };
  for (const row of rows) {
    rates[row.quote] = row.rate;
  }

  const result: ExchangeRates = { base: BASE, rates, fetchedAt: new Date().toISOString() };
  await writeItem(KEY, JSON.stringify(result));
  return result;
}
