import type { ServiceCategory } from "@/types/subscription";

export type ReviewKind = "most_expensive" | "foreign_currency";

// A Smart Review card on Insights. Built from local rules until the AI Edge
// Function sends them (hooks/useSmartReviews.ts).
export type SmartReview = {
  // Stays the same while the facts do, e.g. "most-expensive:<subscription id>",
  // so a review answered with Keep stays hidden.
  id: string;
  kind: ReviewKind;
  subscriptionId: string;
  title: string;
  message: string;
};

// A tracked subscription in the Spend by Category chart.
export type SpendBubble = {
  id: string;
  name: string;
  category: ServiceCategory;
  // Monthly cost in the preferred currency. Sets the bubble's size.
  monthly: number;
  // The same, formatted, e.g. ₦15,700.
  label: string;
};

// One chip above the chart.
export type CategorySpend = {
  category: ServiceCategory;
  // Monthly cost, formatted.
  total: string;
};

export type SpendTrend = "up" | "down" | "same";
