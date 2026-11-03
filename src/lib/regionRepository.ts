import { readItem, writeItem } from "@/lib/storage";
import { findCountry } from "@/lib/regionDetector";
import type { Country } from "@/types/setup";

const KEY = "region";

// The country picked on Create account. Its currency is the preferred currency.
export async function loadRegion(): Promise<Country | undefined> {
  return findCountry(await readItem(KEY));
}

export function saveRegion(country: Country) {
  return writeItem(KEY, country.code);
}
