import { Appearance } from "react-native";
import { create } from "zustand";

import { loadThemePreference, saveThemePreference } from "@/lib/themeRepository";
import type { ThemePreference } from "@/types/theme";

type ThemeState = {
  preference: ThemePreference;
  // True while the splash or onboarding is on screen. Overrides the preference.
  forcedDark: boolean;
  hydrate: () => Promise<void>;
  setPreference: (preference: ThemePreference) => void;
  setForcedDark: (forcedDark: boolean) => void;
};

// NativeWind reads the same Appearance value, so this also switches the CSS variables.
function applyScheme(preference: ThemePreference, forcedDark: boolean) {
  if (forcedDark) {
    Appearance.setColorScheme("dark");
  } else {
    Appearance.setColorScheme(preference === "system" ? "auto" : preference);
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: "system",
  forcedDark: false,
  hydrate: async () => {
    const preference = await loadThemePreference();
    set({ preference });
    applyScheme(preference, get().forcedDark);
  },
  setPreference: (preference) => {
    set({ preference });
    applyScheme(preference, get().forcedDark);
    saveThemePreference(preference);
  },
  setForcedDark: (forcedDark) => {
    set({ forcedDark });
    applyScheme(get().preference, forcedDark);
  },
}));
