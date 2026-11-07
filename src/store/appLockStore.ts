import { create } from "zustand";

import { loadAppLock, saveAppLock } from "@/lib/appLockRepository";

type AppLockState = {
  enabled: boolean;
  // True while the lock screen covers the app. Starts true when App lock is on.
  locked: boolean;
  // Loads the setting. Called once at app start.
  hydrate: () => Promise<void>;
  setEnabled: (enabled: boolean) => void;
  lock: () => void;
  unlock: () => void;
};

export const useAppLockStore = create<AppLockState>((set) => ({
  enabled: false,
  locked: false,

  hydrate: async () => {
    const enabled = await loadAppLock();
    set({ enabled, locked: enabled });
  },
  setEnabled: (enabled) => {
    set({ enabled });
    saveAppLock(enabled);
  },
  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false }),
}));
