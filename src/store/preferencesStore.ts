import { create } from "zustand";

import { detectCurrency } from "@/lib/currencyDetector";
import { loadPreferredCurrency, savePreferredCurrency } from "@/lib/currencyRepository";
import {
  defaultNotificationPreferences,
  loadNotificationPreferences,
  saveNotificationPreferences,
} from "@/lib/notificationPreferencesRepository";
import type { Currency } from "@/types/currency";
import type { NotificationPreferences } from "@/types/notifications";

type PreferencesState = {
  // The signed-in account the preferences belong to. Undefined when signed out.
  userId?: string;
  // Totals and converted amounts show in this currency. Picked on Create account.
  currency: Currency;
  // True while it is still the one guessed from the phone.
  currencyDetected: boolean;
  notifications: NotificationPreferences;

  // Loads an account's preferences. The root layout calls it whenever the signed-in account changes.
  hydrate: (userId: string | undefined) => Promise<void>;
  setCurrency: (currency: Currency) => void;
  // Called on Create account, before the new account is signed in.
  saveCurrency: (userId: string) => Promise<void>;
  // Changes the preferred currency of the signed-in account and saves it (Settings).
  changeCurrency: (currency: Currency) => void;
  setNotifications: (changes: Partial<NotificationPreferences>) => void;
};

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  currency: detectCurrency(),
  currencyDetected: true,
  notifications: defaultNotificationPreferences,

  hydrate: async (userId) => {
    set({ userId, notifications: defaultNotificationPreferences });
    if (!userId) {
      // Signed out: Create account starts again from the phone's own currency.
      set({ currency: detectCurrency(), currencyDetected: true });
      return;
    }
    const [currency, notifications] = await Promise.all([
      loadPreferredCurrency(userId),
      loadNotificationPreferences(userId),
    ]);
    // Another sign-in may have replaced this account while it was loading.
    if (get().userId !== userId) {
      return;
    }
    set({ notifications });
    if (currency) {
      set({ currency, currencyDetected: false });
    }
  },
  setCurrency: (currency) => set({ currency, currencyDetected: false }),
  saveCurrency: (userId) => savePreferredCurrency(userId, get().currency),
  changeCurrency: (currency) => {
    set({ currency, currencyDetected: false });
    const { userId } = get();
    if (userId) {
      savePreferredCurrency(userId, currency);
    }
  },
  setNotifications: (changes) => {
    const notifications = { ...get().notifications, ...changes };
    set({ notifications });
    const { userId } = get();
    if (userId) {
      saveNotificationPreferences(userId, notifications);
    }
  },
}));
