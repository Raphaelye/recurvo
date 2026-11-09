export type CardType = "Debit" | "Credit" | "Virtual";

export type BillingCycle = "Weekly" | "Monthly" | "Yearly";

// Only the last 4 digits are ever kept, never the full number or CVV.
export type PaymentCard = {
  name: string;
  last4: string;
  type: CardType;
};

// The picked bank statement. It is deleted once parsing ends.
export type StatementFile = {
  uri: string;
  name: string;
  // In bytes.
  size: number;
  kind: "pdf" | "csv";
};

// A recurring charge found in a bank statement.
export type DetectedSubscription = {
  id: string;
  name: string;
  // Per charge, in the statement's currency.
  amount: number;
  // Missing until the user picks how often it bills.
  cycle?: BillingCycle;
  // ISO date of the last charge on the statement.
  lastCharge: string;
  // ISO date. Projected from the last charge and the cycle, the user can change it.
  nextRenewal: string;
  // How many times the charge appears on the statement.
  seenCount: number;
  // Extra detail for the row, e.g. the original "$4.00" of a dollar charge.
  note?: string;
  // Not sure it repeats yet. The row starts unticked with "Set cycle" highlighted.
  possible?: boolean;
};

export type ReviewItem = DetectedSubscription & { tracked: boolean };

export type StatementResult = {
  // Undefined when the statement shows no card or account number.
  card?: PaymentCard;
  // The account's currency code, when the statement shows one the app supports.
  // The amounts are in it.
  currency?: string;
  subscriptions: DetectedSubscription[];
};
