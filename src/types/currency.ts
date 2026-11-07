// A currency the app offers (data/currencies.ts).
export type Currency = {
  // ISO 4217 code, e.g. NGN.
  code: string;
  // e.g. Nigerian naira.
  name: string;
  // Shown before amounts, e.g. ₦ or KSh. Distinct per currency, in Latin script.
  symbol: string;
};

// Daily exchange rates. Each rate is how much of that currency one unit of the
// base buys, e.g. base USD and NGN 1345.45. The base itself is in the map at 1.
export type ExchangeRates = {
  base: string;
  rates: Record<string, number>;
  // ISO time the app fetched them, to know when to refresh.
  fetchedAt: string;
};
