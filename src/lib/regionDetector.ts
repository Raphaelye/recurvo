import { getCalendars, getLocales } from "expo-localization";

import { countries } from "@/data/setup";
import type { Country } from "@/types/setup";

const timeZones: Record<string, Country["code"]> = {
  "Africa/Lagos": "NG",
  "Africa/Accra": "GH",
  "Africa/Nairobi": "KE",
  "Africa/Johannesburg": "ZA",
};

const other = countries[countries.length - 1];

export function findCountry(code: string | null | undefined) {
  return countries.find((country) => country.code === code);
}

// Guesses the country from the phone's time zone, then its region setting.
// The time zone comes first: many phones keep a US or UK region setting.
// Anything outside the supported countries is "Other", in US dollars.
export function detectRegion(): Country {
  const timeZone = getCalendars()[0]?.timeZone;
  const fromTimeZone = timeZone ? findCountry(timeZones[timeZone]) : undefined;
  const fromLocale = findCountry(getLocales()[0]?.regionCode);
  return fromTimeZone ?? fromLocale ?? other;
}
