import { create } from "zustand";

import { loadPendingSetup, savePendingSetup } from "@/lib/setupRepository";
import { deleteStatementFile } from "@/lib/statementFiles";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import type {
  BillingCycle,
  DetectedSubscription,
  PaymentCard,
  ReviewItem,
  StatementFile,
} from "@/types/setup";

type CardStatus = "idle" | "reading" | "found" | "failed";

type OnboardingState = {
  // Clerk user id of an account that signed up and has not finished card setup.
  // The app opens the upload step instead of Home for that user, even after a restart.
  pendingSetupFor?: string;

  // The card being set up. Cleared by resetCard() for "Add another card or bank".
  bank?: string;
  // The picked statement, until it is parsed. Deleted from the phone when it is
  // parsed, replaced or the card is reset.
  file?: StatementFile;
  card?: PaymentCard;
  cardStatus: CardStatus;
  items: ReviewItem[];

  // Loads the pending setup. Called once at app start.
  hydrate: () => Promise<void>;
  startSetup: (userId: string) => void;
  finishSetup: () => void;
  setBank: (bank: string) => void;
  setFile: (file?: StatementFile) => void;
  // Deletes the parsed statement but keeps the card it came from.
  discardStatement: () => void;
  setCard: (status: CardStatus, card?: PaymentCard) => void;
  setDetected: (subscriptions: DetectedSubscription[]) => void;
  toggleTracked: (id: string) => void;
  updateItem: (id: string, changes: { cycle: BillingCycle; nextRenewal: string; tracked?: boolean }) => void;
  saveTracked: () => Promise<void>;
  resetCard: () => void;
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  cardStatus: "idle",
  items: [],

  hydrate: async () => {
    set({ pendingSetupFor: await loadPendingSetup() });
  },
  startSetup: (userId) => {
    set({ pendingSetupFor: userId });
    savePendingSetup(userId);
  },
  finishSetup: () => {
    set({ pendingSetupFor: undefined });
    savePendingSetup(undefined);
  },
  setBank: (bank) => set({ bank }),
  // A new file means the card has to be read again.
  setFile: (file) => {
    const previous = get().file;
    if (previous && previous.uri !== file?.uri) {
      deleteStatementFile(previous);
    }
    set({ file, card: undefined, cardStatus: "idle" });
  },
  discardStatement: () => {
    const { file } = get();
    if (file) {
      deleteStatementFile(file);
    }
    set({ file: undefined });
  },
  setCard: (cardStatus, card) => set({ cardStatus, card }),
  // Possible subscriptions start unticked, the user confirms them.
  setDetected: (subscriptions) =>
    set({ items: subscriptions.map((item) => ({ ...item, tracked: !item.possible })) }),
  toggleTracked: (id) =>
    set({
      items: get().items.map((item) => (item.id === id ? { ...item, tracked: !item.tracked } : item)),
    }),
  updateItem: (id, changes) =>
    set({ items: get().items.map((item) => (item.id === id ? { ...item, ...changes } : item)) }),
  saveTracked: async () => {
    const { items, card } = get();
    if (!card) {
      return;
    }
    // A statement's amounts are in the account's preferred currency.
    const { currency } = usePreferencesStore.getState();
    await useSubscriptionStore.getState().add(
      items
        .filter((item) => item.tracked && item.cycle)
        .map((item) => ({
          id: item.id,
          name: item.name,
          amount: item.amount,
          currency: currency.code,
          cycle: item.cycle ?? "Monthly",
          nextRenewal: item.nextRenewal,
          card,
        })),
    );
  },
  resetCard: () => {
    get().discardStatement();
    set({ bank: undefined, card: undefined, cardStatus: "idle", items: [] });
  },
}));
