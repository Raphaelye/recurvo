import { create } from "zustand";

import { detectRegion } from "@/lib/regionDetector";
import { loadRegion, saveRegion } from "@/lib/regionRepository";
import type { Country } from "@/types/setup";

type PreferencesState = {
  // The country picked on Create account. Its currency is the preferred currency.
  region: Country;
  // False once the user picks a country themselves.
  regionDetected: boolean;

  // Loads the saved region. Called once at app start.
  hydrate: () => Promise<void>;
  setRegion: (region: Country) => void;
  saveRegion: () => Promise<void>;
};

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  region: detectRegion(),
  regionDetected: true,

  hydrate: async () => {
    const region = await loadRegion();
    if (region) {
      set({ region, regionDetected: false });
    }
  },
  setRegion: (region) => set({ region, regionDetected: false }),
  saveRegion: () => saveRegion(get().region),
}));
