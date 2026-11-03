import type { BillingCycle, Country } from "@/types/setup";

export const countries: Country[] = [
  { code: "NG", name: "Nigeria", currency: "NGN", symbol: "₦" },
  { code: "GH", name: "Ghana", currency: "GHS", symbol: "₵" },
  { code: "KE", name: "Kenya", currency: "KES", symbol: "KSh" },
  { code: "ZA", name: "South Africa", currency: "ZAR", symbol: "R" },
  { code: "OTHER", name: "Other", currency: "USD", symbol: "$" },
];

export const banks = [
  "Access Bank",
  "GTBank",
  "Zenith",
  "UBA",
  "First Bank",
  "Kuda",
  "Moniepoint",
  "Opay",
  "Chipper",
  "Other",
];

export const billingCycles: BillingCycle[] = ["Weekly", "Monthly", "Quarterly", "Yearly"];

// The numbered steps of the flow, in order. The step bar and its count come from
// this list, matched against the last segment of the current route.
export const flowSteps = ["sign-up", "upload", "review"] as const;

// Each scan step ends at this share of the parser's progress.
export const scanSteps = [
  { label: "Card found", endsAt: 0.15 },
  { label: "Matching merchants", endsAt: 0.5 },
  { label: "Spotting recurring charges", endsAt: 0.85 },
  { label: "Preparing your review", endsAt: 1 },
];

export const MAX_STATEMENT_BYTES = 10 * 1024 * 1024;
