import { getCalendars, getLocales } from "expo-localization";

import { usDollar } from "@/data/currencies";
import { findCurrency } from "@/lib/currency";
import type { Currency } from "@/types/currency";

// African time zones are checked first: many phones there keep a US or UK
// region setting, which would suggest dollars or pounds. Only zones used by a
// single country are listed.
const timeZoneCurrencies: Record<string, string> = {
  "Africa/Lagos": "NGN",
  "Africa/Accra": "GHS",
  "Africa/Nairobi": "KES",
  "Africa/Johannesburg": "ZAR",
  "Africa/Cairo": "EGP",
  "Africa/Casablanca": "MAD",
  "Africa/Dar_es_Salaam": "TZS",
  "Africa/Kampala": "UGX",
  "Africa/Kigali": "RWF",
  "Africa/Lusaka": "ZMW",
  "Africa/Addis_Ababa": "ETB",
};

// Guesses the preferred currency from the phone's time zone, then its region
// setting. Anything outside the offered currencies is US dollars.
export function detectCurrency(): Currency {
  const timeZone = getCalendars()[0]?.timeZone;
  const fromTimeZone = timeZone ? findCurrency(timeZoneCurrencies[timeZone]) : undefined;
  const fromLocale = findCurrency(getLocales()[0]?.currencyCode);
  return fromTimeZone ?? fromLocale ?? usDollar;
}
