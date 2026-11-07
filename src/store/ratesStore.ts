import { create } from "zustand";

import { currencies } from "@/data/currencies";
import { fetchRates, loadRates } from "@/lib/ratesRepository";
import type { ExchangeRates } from "@/types/currency";

const DAY_MS = 24 * 60 * 60 * 1000;

type RatesState = {
  // Undefined until rates have been fetched once.
  rates?: ExchangeRates;
  // Loads the saved rates. Called once at app start.
  hydrate: () => Promise<void>;
};

export const useRatesStore = create<RatesState>((set) => ({
  rates: undefined,

  hydrate: async () => {
    const saved = await loadRates();
    set({ rates: saved });

    // Refreshed once a day, or sooner when the list of currencies has grown since.
    // Not awaited, so the app never waits on the network.
    const stale =
      !saved ||
      Date.now() - new Date(saved.fetchedAt).getTime() > DAY_MS ||
      currencies.some((currency) => saved.rates[currency.code] === undefined);
    if (stale) {
      fetchRates()
        .then((rates) => set({ rates }))
        // Offline or the API is down: keep the saved rates and try again next launch.
        .catch(() => {});
    }
  },
}));
