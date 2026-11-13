import { getCalendars } from "expo-localization";
import { create } from "zustand";

import { detectCurrency } from "@/lib/currencyDetector";
import {
  defaultNotificationPreferences,
  fetchPreferences,
  loadPreferencesCopy,
  saveNotificationPreferences,
  savePreferencesCopy,
  savePreferredCurrency,
  saveTimeZone,
  type SavedPreferences,
} from "@/lib/preferencesRepository";
import { alertSaveFailed, createSaveQueue } from "@/lib/saveQueue";
import type { Currency } from "@/types/currency";
import type { NotificationPreferences } from "@/types/notifications";

type Preferences = {
  // Totals and converted amounts show in this currency. Picked on Create account.
  currency: Currency;
  // True while it is still the one guessed from the phone.
  currencyDetected: boolean;
  notifications: NotificationPreferences;
};

type PreferencesState = Preferences & {
  // The signed-in account the preferences belong to. Undefined when signed out.
  userId?: string;

  // Loads an account's preferences. The root layout calls it whenever the signed-in account changes.
  hydrate: (userId: string | undefined) => Promise<void>;
  // Loads them from Supabase again, e.g. when the app comes back to the foreground.
  refresh: () => Promise<void>;
  setCurrency: (currency: Currency) => void;
  // The saves below resolve true once Supabase has saved them.
  // Called on Create account, once the new account is signed in.
  saveCurrency: (userId: string) => Promise<boolean>;
  // Changes the preferred currency of the signed-in account and saves it (Settings).
  changeCurrency: (currency: Currency) => Promise<boolean>;
  setNotifications: (changes: Partial<NotificationPreferences>) => Promise<boolean>;
};

// What Supabase holds: a currency guessed from the phone was never saved.
function savedPart({ currency, currencyDetected, notifications }: Preferences): SavedPreferences {
  return { currency: currencyDetected ? undefined : currency, notifications };
}

let saves = createSaveQueue();

export const usePreferencesStore = create<PreferencesState>((set, get) => {
  // Without a saved currency, the one already shown stays.
  const show = ({ currency, notifications }: SavedPreferences) => {
    set(currency ? { currency, currencyDetected: false, notifications } : { notifications });
  };

  // Shows a change, then saves it. If Supabase can't save it, the preferences go
  // back to how they were and the user is told.
  const change = (
    apply: (current: Preferences) => Partial<Preferences>,
    save: (userId: string, next: Preferences) => Promise<void>,
  ) => {
    const { userId } = get();
    if (!userId) {
      return Promise.resolve(false);
    }
    return saves.run(async () => {
      // Signed out while the save before it was running.
      if (get().userId !== userId) {
        return false;
      }
      const { currency, currencyDetected, notifications } = get();
      const before = { currency, currencyDetected, notifications };
      set(apply(before));
      try {
        await save(userId, get());
      } catch {
        if (get().userId === userId) {
          set(before);
        }
        alertSaveFailed();
        return false;
      }
      if (get().userId === userId) {
        savePreferencesCopy(userId, savedPart(get()));
      }
      return true;
    });
  };

  return {
    currency: detectCurrency(),
    currencyDetected: true,
    notifications: defaultNotificationPreferences,

    hydrate: async (userId) => {
      set({ userId, notifications: defaultNotificationPreferences });
      saves = createSaveQueue();
      if (!userId) {
        // Signed out: Create account starts again from the phone's own currency.
        set({ currency: detectCurrency(), currencyDetected: true });
        return;
      }
      const copy = await loadPreferencesCopy(userId);
      // Another sign-in may have replaced this account while it was loading.
      if (get().userId !== userId) {
        return;
      }
      if (copy) {
        show(copy);
        get().refresh();
        return;
      }
      // The first load on this phone waits for Supabase, so totals never flash
      // in the wrong currency.
      await get().refresh();
    },
    refresh: async () => {
      const { userId } = get();
      if (!userId) {
        return;
      }
      const queue = saves;
      const start = queue.version();
      let saved: SavedPreferences;
      try {
        saved = await fetchPreferences(userId);
      } catch {
        // Offline or Supabase is unreachable: the copy stays.
        return;
      }
      if (get().userId !== userId || !queue.quietSince(start)) {
        return;
      }
      show(saved);
      savePreferencesCopy(userId, saved);
      // Keeps the saved time zone in step with the phone, e.g. after travelling.
      // Not urgent: a failed save is tried again on the next refresh.
      const timeZone = getCalendars()[0]?.timeZone;
      if (timeZone && timeZone !== saved.timeZone && timeZone.length <= 64) {
        saveTimeZone(userId, timeZone).catch(() => undefined);
      }
    },
    setCurrency: (currency) => set({ currency, currencyDetected: false }),
    // Create account picks the currency before the account exists, so it is saved
    // for that new account, even if the store hasn't switched to it yet.
    saveCurrency: (userId) => {
      const { currency } = get();
      return saves.run(async () => {
        try {
          await savePreferredCurrency(userId, currency);
        } catch {
          alertSaveFailed();
          return false;
        }
        if (get().userId === userId) {
          savePreferencesCopy(userId, { currency, notifications: get().notifications });
        }
        return true;
      });
    },
    changeCurrency: (currency) =>
      change(
        () => ({ currency, currencyDetected: false }),
        (userId) => savePreferredCurrency(userId, currency),
      ),
    setNotifications: (changes) =>
      change(
        (current) => ({ notifications: { ...current.notifications, ...changes } }),
        (userId, next) => saveNotificationPreferences(userId, next.notifications),
      ),
  };
});
