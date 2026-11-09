import { FunctionsHttpError } from "@supabase/supabase-js";

import { projectRenewal } from "@/lib/billing";
import { currencySymbol, findCurrency, formatPrice } from "@/lib/currency";
import { supabase } from "@/lib/supabase";
import type {
  BillingCycle,
  DetectedSubscription,
  PaymentCard,
  StatementFile,
  StatementResult,
} from "@/types/setup";

// Reads a bank statement with the parse-statement Edge Function, which asks
// OpenAI. The app talks to this interface only. Nothing here logs or keeps the
// statement: it is sent once per request and deleted from the phone after the scan.
export type StatementParser = {
  // Reads the card name, last 4 digits and type from the statement header.
  readCard: (file: StatementFile, bank: string) => Promise<PaymentCard>;
  // Finds the recurring charges. onProgress gets 0 to 1. Rejects with an
  // AbortError when the signal aborts, and a LimitError past the daily limit.
  parse: (
    file: StatementFile,
    bank: string,
    onProgress: (progress: number) => void,
    signal?: AbortSignal,
  ) => Promise<StatementResult>;
};

// What the function returns (supabase/functions/parse-statement/statement.ts).
type CardResponse = { card: PaymentCard | null };

type ScanResponse = {
  card: PaymentCard | null;
  currency: string | null;
  subscriptions: {
    name: string;
    // Oldest first, dates as YYYY-MM-DD.
    charges: { date: string; amount: number }[];
    // The latest charge in its own currency, when it was paid in another one.
    original: { currency: string; amount: number } | null;
  }[];
};

const CARD_TIMEOUT_MS = 60_000;
// The function gives OpenAI 140 s for a scan.
const SCAN_TIMEOUT_MS = 150_000;
const DAY_MS = 24 * 60 * 60 * 1000;

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

function statementForm(mode: "card" | "scan", file: StatementFile, bank: string) {
  const form = new FormData();
  form.append("mode", mode);
  form.append("bank", bank);
  // React Native sends a { uri, name, type } part by reading the file from its
  // uri. A generic name, so the picked file's name never leaves the phone.
  const part = {
    uri: file.uri,
    name: `statement.${file.kind}`,
    type: file.kind === "pdf" ? "application/pdf" : "text/csv",
  };
  form.append("file", part as unknown as Blob);
  return form;
}

async function callParser<T>(
  mode: "card" | "scan",
  file: StatementFile,
  bank: string,
  timeout: number,
  signal?: AbortSignal,
) {
  const { data, error } = await supabase.functions.invoke<T>("parse-statement", {
    body: statementForm(mode, file, bank),
    timeout,
    signal,
  });
  if (signal?.aborted) {
    throw abortError();
  }
  if (error) {
    const code = error instanceof FunctionsHttpError ? await errorCode(error) : undefined;
    const failure = new Error(code ?? "Could not read the statement");
    if (code === "limit") {
      failure.name = "LimitError";
    }
    throw failure;
  }
  if (!data) {
    throw new Error("Could not read the statement");
  }
  return data;
}

// The function's error code, e.g. "limit" or "not_statement".
async function errorCode(error: FunctionsHttpError) {
  try {
    const body: unknown = await (error.context as Response).json();
    return typeof body === "object" && body !== null && "error" in body
      ? String(body.error)
      : undefined;
  } catch {
    return undefined;
  }
}

// The scan is one request, so its progress is an estimate: a curve sized to the
// file that slows down near 90% and only reaches 100% with the result.
function estimateProgress(file: StatementFile, onProgress: (progress: number) => void) {
  // About 15 s plus 25 s per MB, at most 90 s.
  const expectedMs = Math.min(90_000, 15_000 + (file.size / (1024 * 1024)) * 25_000);
  const started = Date.now();
  onProgress(0);
  const timer = setInterval(() => {
    const elapsed = Date.now() - started;
    onProgress(0.9 * (1 - Math.exp((-2.5 * elapsed) / expectedMs)));
  }, 100);
  return () => clearInterval(timer);
}

// A charge's date at noon local time, so it stays on that day in every time zone.
function chargeDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

// The cycle the gaps between charges point to: their median must look weekly,
// monthly or yearly. Undefined for a single charge or an irregular pattern.
function detectCycle(dates: Date[]): BillingCycle | undefined {
  if (dates.length < 2) {
    return undefined;
  }
  const gaps = dates
    .slice(1)
    .map((date, index) => (date.getTime() - dates[index].getTime()) / DAY_MS)
    .sort((a, b) => a - b);
  const median = gaps[Math.floor(gaps.length / 2)];
  if (median >= 5 && median <= 9) {
    return "Weekly";
  }
  if (median >= 25 && median <= 35) {
    return "Monthly";
  }
  if (median >= 350 && median <= 380) {
    return "Yearly";
  }
  return undefined;
}

// Unique within one statement. The store adds the card's last 4 digits.
function uniqueId(name: string, used: Set<string>) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "subscription";
  let id = base;
  for (let count = 2; used.has(id); count += 1) {
    id = `${base}-${count}`;
  }
  used.add(id);
  return id;
}

function toDetected(
  item: ScanResponse["subscriptions"][number],
  currency: string | undefined,
  used: Set<string>,
): DetectedSubscription {
  // One charge per day: a second one the same day doesn't change the cycle.
  const byDay = new Map(item.charges.map((charge) => [charge.date, charge]));
  const charges = [...byDay.values()];
  const dates = charges.map((charge) => chargeDate(charge.date));
  const latest = charges[charges.length - 1];
  const lastCharge = dates[dates.length - 1].toISOString();
  const cycle = detectCycle(dates);
  const original =
    item.original && item.original.currency !== currency ? item.original : undefined;
  return {
    id: uniqueId(item.name, used),
    name: item.name,
    amount: latest.amount,
    cycle,
    lastCharge,
    // A possible one is projected monthly until the user picks its cycle.
    nextRenewal: projectRenewal(lastCharge, cycle ?? "Monthly"),
    seenCount: charges.length,
    note: original ? formatPrice(original.amount, currencySymbol(original.currency)) : undefined,
    // Seen once, or not on a regular schedule: the user confirms it.
    possible: cycle === undefined ? true : undefined,
  };
}

function toStatementResult(response: ScanResponse): StatementResult {
  // Only a currency the app supports. Otherwise the preferred one is used.
  const currency = findCurrency(response.currency)?.code;
  const used = new Set<string>();
  return {
    card: response.card ?? undefined,
    currency,
    subscriptions: response.subscriptions
      .filter((item) => item.charges.length > 0)
      .map((item) => toDetected(item, currency, used)),
  };
}

export const statementParser: StatementParser = {
  async readCard(file, bank) {
    const { card } = await callParser<CardResponse>("card", file, bank, CARD_TIMEOUT_MS);
    if (!card) {
      throw new Error("Card details not found in the statement");
    }
    return card;
  },

  async parse(file, bank, onProgress, signal) {
    const stopEstimate = estimateProgress(file, onProgress);
    let response: ScanResponse;
    try {
      response = await callParser<ScanResponse>("scan", file, bank, SCAN_TIMEOUT_MS, signal);
    } finally {
      stopEstimate();
    }
    onProgress(1);
    // A moment at 100%, so the beam finishes before the results open.
    await wait(400, signal);
    return toStatementResult(response);
  },
};

export function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

// The account sent too many statements today (20 card reads and scans).
export function isLimitError(error: unknown) {
  return error instanceof Error && error.name === "LimitError";
}
