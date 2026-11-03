import { daysFromToday, projectRenewal } from "@/lib/billing";
import type {
  DetectedSubscription,
  PaymentCard,
  StatementFile,
  StatementResult,
} from "@/types/setup";

// Reads a bank statement. The app talks to this interface only, so the mock
// below can be swapped for the Supabase Edge Function without touching screens.
// Implementations must never log or keep the statement contents.
export type StatementParser = {
  // Reads the card name, last 4 digits and type from the statement header.
  readCard: (file: StatementFile, bank: string) => Promise<PaymentCard>;
  // Finds the recurring charges. onProgress gets 0 to 1. Rejects with an
  // AbortError when the signal aborts.
  parse: (
    file: StatementFile,
    bank: string,
    onProgress: (progress: number) => void,
    signal?: AbortSignal,
  ) => Promise<StatementResult>;
};

function abortError() {
  const error = new Error("Scan cancelled");
  error.name = "AbortError";
  return error;
}

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(abortError());
      },
      { once: true },
    );
  });
}

function mockCard(file: StatementFile, bank: string): PaymentCard {
  const brand = /mastercard/i.test(file.name) ? "Mastercard" : /verve/i.test(file.name) ? "Verve" : "Visa";
  return { name: `${bank === "Other" ? "Card" : bank} ${brand}`, last4: "4417", type: "Debit" };
}

// Dates are relative to today, so every renewal is in the future.
function mockSubscriptions(): DetectedSubscription[] {
  const monthly = (
    id: string,
    name: string,
    amount: number,
    daysAgo: number,
    seenCount: number,
    note?: string,
  ): DetectedSubscription => {
    const lastCharge = daysFromToday(-daysAgo);
    return {
      id,
      name,
      amount,
      cycle: "Monthly",
      lastCharge,
      nextRenewal: projectRenewal(lastCharge, "Monthly"),
      seenCount,
      note,
    };
  };

  const appleLastCharge = daysFromToday(-18);
  return [
    monthly("netflix", "Netflix", 4400, 12, 6),
    monthly("spotify", "Spotify", 1700, 20, 6),
    monthly("github", "GitHub", 6200, 27, 4, "$4.00"),
    monthly("dstv", "DStv Compact", 15700, 5, 6),
    {
      id: "apple",
      name: "APPLE.COM/BILL",
      amount: 2100,
      lastCharge: appleLastCharge,
      nextRenewal: projectRenewal(appleLastCharge, "Monthly"),
      seenCount: 2,
      possible: true,
    },
  ];
}

// Mock with realistic timings. Name a file "unreadable.pdf" to test the manual
// card fallback, or "error.pdf" to test the scan error state.
const mockStatementParser: StatementParser = {
  async readCard(file, bank) {
    await wait(700);
    if (/unreadable/i.test(file.name)) {
      throw new Error("Card details not found in the statement header");
    }
    return mockCard(file, bank);
  },

  async parse(file, bank, onProgress, signal) {
    let progress = 0;
    onProgress(progress);
    while (progress < 1) {
      // Uneven steps, like a real parser that is faster on some pages.
      await wait(70 + Math.random() * 90, signal);
      progress = Math.min(1, progress + 0.012 + Math.random() * 0.03);
      onProgress(progress);
      if (progress > 0.4 && /error/i.test(file.name)) {
        throw new Error("Could not read the statement");
      }
    }
    await wait(250, signal);
    return { card: mockCard(file, bank), subscriptions: mockSubscriptions() };
  },
};

export const statementParser: StatementParser = mockStatementParser;

export function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}
