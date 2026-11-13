// Currencies, rates and amount formatting for the review text, written to match
// the app (src/data/currencies.ts and src/lib/currency.ts). The function can't
// import the app's files, so keep this list in step with currencies.ts.

type Currency = { code: string; name: string; symbol: string };

const currencies: Currency[] = [
  { code: "AED", name: "UAE dirham", symbol: "Dhs" },
  { code: "ARS", name: "Argentine peso", symbol: "AR$" },
  { code: "AUD", name: "Australian dollar", symbol: "A$" },
  { code: "BDT", name: "Bangladeshi taka", symbol: "৳" },
  { code: "BRL", name: "Brazilian real", symbol: "R$" },
  { code: "CAD", name: "Canadian dollar", symbol: "CA$" },
  { code: "CHF", name: "Swiss franc", symbol: "CHF" },
  { code: "CLP", name: "Chilean peso", symbol: "CL$" },
  { code: "CNY", name: "Chinese yuan", symbol: "CN¥" },
  { code: "COP", name: "Colombian peso", symbol: "COL$" },
  { code: "CZK", name: "Czech koruna", symbol: "Kč" },
  { code: "DKK", name: "Danish krone", symbol: "Dkr" },
  { code: "EGP", name: "Egyptian pound", symbol: "E£" },
  { code: "ETB", name: "Ethiopian birr", symbol: "Br" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British pound", symbol: "£" },
  { code: "GHS", name: "Ghanaian cedi", symbol: "GH₵" },
  { code: "HKD", name: "Hong Kong dollar", symbol: "HK$" },
  { code: "HUF", name: "Hungarian forint", symbol: "Ft" },
  { code: "IDR", name: "Indonesian rupiah", symbol: "Rp" },
  { code: "ILS", name: "Israeli new shekel", symbol: "₪" },
  { code: "INR", name: "Indian rupee", symbol: "₹" },
  { code: "JPY", name: "Japanese yen", symbol: "¥" },
  { code: "KES", name: "Kenyan shilling", symbol: "KSh" },
  { code: "KRW", name: "South Korean won", symbol: "₩" },
  { code: "KWD", name: "Kuwaiti dinar", symbol: "KD" },
  { code: "MAD", name: "Moroccan dirham", symbol: "DH" },
  { code: "MXN", name: "Mexican peso", symbol: "MX$" },
  { code: "MYR", name: "Malaysian ringgit", symbol: "RM" },
  { code: "NGN", name: "Nigerian naira", symbol: "₦" },
  { code: "NOK", name: "Norwegian krone", symbol: "Nkr" },
  { code: "NZD", name: "New Zealand dollar", symbol: "NZ$" },
  { code: "PEN", name: "Peruvian sol", symbol: "S/" },
  { code: "PHP", name: "Philippine peso", symbol: "₱" },
  { code: "PKR", name: "Pakistani rupee", symbol: "₨" },
  { code: "PLN", name: "Polish złoty", symbol: "zł" },
  { code: "QAR", name: "Qatari riyal", symbol: "QR" },
  { code: "RON", name: "Romanian leu", symbol: "lei" },
  { code: "RUB", name: "Russian ruble", symbol: "₽" },
  { code: "RWF", name: "Rwandan franc", symbol: "FRw" },
  { code: "SAR", name: "Saudi riyal", symbol: "SR" },
  { code: "SEK", name: "Swedish krona", symbol: "Skr" },
  { code: "SGD", name: "Singapore dollar", symbol: "S$" },
  { code: "THB", name: "Thai baht", symbol: "฿" },
  { code: "TRY", name: "Turkish lira", symbol: "₺" },
  { code: "TWD", name: "New Taiwan dollar", symbol: "NT$" },
  { code: "TZS", name: "Tanzanian shilling", symbol: "TSh" },
  { code: "UAH", name: "Ukrainian hryvnia", symbol: "₴" },
  { code: "UGX", name: "Ugandan shilling", symbol: "USh" },
  { code: "USD", name: "US dollar", symbol: "$" },
  { code: "VND", name: "Vietnamese dong", symbol: "₫" },
  { code: "XAF", name: "Central African CFA franc", symbol: "FCFA" },
  { code: "XOF", name: "West African CFA franc", symbol: "CFA" },
  { code: "ZAR", name: "South African rand", symbol: "R" },
  { code: "ZMW", name: "Zambian kwacha", symbol: "ZK" },
];

function findCurrency(code: string) {
  return currencies.find((currency) => currency.code === code);
}

// "US dollar". A code outside the list stays the code.
export function currencyName(code: string) {
  return findCurrency(code)?.name ?? code;
}

// ₦30,100 or KSh 30,100: a symbol ending in a letter gets a space.
function withSymbol(value: string, code: string) {
  const symbol = findCurrency(code)?.symbol ?? code;
  const last = symbol.slice(-1);
  const endsInLetter = last.toLowerCase() !== last.toUpperCase();
  return `${symbol}${symbol.length > 1 && endsInLetter ? " " : ""}${value}`;
}

// Whole units, for amounts in the preferred currency: ₦30,100.
export function formatAmount(amount: number, code: string) {
  return withSymbol(Math.round(amount).toLocaleString("en-US"), code);
}

// With cents, for a price in its own currency: $4.00.
export function formatPrice(amount: number, code: string) {
  const value = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return withSymbol(value, code);
}

// One US dollar in each currency.
export type Rates = Record<string, number>;

// Today's central bank rates from Frankfurter, the same source as the app.
export async function fetchRates(): Promise<Rates> {
  const quotes = currencies
    .map((currency) => currency.code)
    .filter((code) => code !== "USD")
    .join(",");
  const response = await fetch(`https://api.frankfurter.dev/v2/rates?base=USD&quotes=${quotes}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`Exchange rates request failed with ${response.status}`);
  }
  const rows = (await response.json()) as { quote: string; rate: number }[];
  const rates: Rates = { USD: 1 };
  for (const row of rows) {
    rates[row.quote] = row.rate;
  }
  return rates;
}

// Undefined while a rate is missing.
export function convert(amount: number, from: string, to: string, rates: Rates) {
  if (from === to) {
    return amount;
  }
  const fromRate = rates[from];
  const toRate = rates[to];
  return fromRate && toRate ? (amount / fromRate) * toRate : undefined;
}
