// Formats an amount with its currency symbol, e.g. ₦30,100.
// Placeholder until the currency feature (preferred currency, exchange rates) is built.
export function formatAmount(amount: number, symbol: string) {
  return `${symbol}${Math.round(amount).toLocaleString("en-US")}`;
}
