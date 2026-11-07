import { currencies } from "@/data/currencies";
import type { ExchangeRates } from "@/types/currency";

export function findCurrency(code: string | null | undefined) {
  return currencies.find((currency) => currency.code === code);
}

// Plurals that aren't the name plus "s", by the name's last word.
const plurals: Record<string, string> = {
  Euro: "euros",
  real: "reais",
  krone: "kroner",
  krona: "kronor",
  leu: "lei",
  lira: "lira",
  sol: "soles",
  naira: "naira",
  yen: "yen",
  won: "won",
  yuan: "yuan",
  baht: "baht",
  rand: "rand",
  rupiah: "rupiah",
  ringgit: "ringgit",
  dong: "dong",
  kwacha: "kwacha",
  taka: "taka",
  birr: "birr",
};

// "billed in US dollars". A code outside the list shows as the code.
export function currencyPlural(code: string) {
  const name = findCurrency(code)?.name;
  if (!name) {
    return code;
  }
  const words = name.split(" ");
  const last = words.pop() ?? "";
  return [...words, plurals[last] ?? `${last}s`].join(" ");
}

// The symbol for a currency code, e.g. NGN → ₦. A code outside the list shows as the code.
export function currencySymbol(code: string) {
  return findCurrency(code)?.symbol ?? code;
}

// A symbol made of letters (CHF, KSh) needs a space before the number. A sign (₦, $)
// or a one-letter symbol (R) sits right against it.
function separator(symbol: string) {
  const last = symbol.slice(-1);
  const endsInLetter = last.toLowerCase() !== last.toUpperCase();
  return symbol.length > 1 && endsInLetter ? " " : "";
}

// Puts the symbol in front of an already formatted number: ₦0.00, KSh 0.00.
export function withSymbol(value: string, symbol: string) {
  return `${symbol}${separator(symbol)}${value}`;
}

// Formats an amount with its currency symbol, e.g. ₦30,100 or KSh 30,100.
export function formatAmount(amount: number, symbol: string) {
  return withSymbol(Math.round(amount).toLocaleString("en-US"), symbol);
}

// With cents, for a price in another currency: $4.00, € 12.50.
export function formatPrice(amount: number, symbol: string) {
  const value = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return withSymbol(value, symbol);
}

// Converts through the rates' base currency. Undefined while a rate is missing,
// e.g. offline on the very first launch.
export function convertAmount(amount: number, from: string, to: string, rates?: ExchangeRates) {
  if (from === to) {
    return amount;
  }
  const fromRate = rates?.rates[from];
  const toRate = rates?.rates[to];
  if (!fromRate || !toRate) {
    return undefined;
  }
  return (amount / fromRate) * toRate;
}

// Today's rate of a foreign currency in the preferred one, saved when a subscription
// is added. Undefined for the preferred currency itself, or while rates are missing.
export function startRateFor(from: string, preferred: string, rates?: ExchangeRates) {
  const rate = from === preferred ? undefined : convertAmount(1, from, preferred, rates);
  return rate === undefined ? undefined : { currency: preferred, rate };
}
