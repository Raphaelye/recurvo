import type { BillingCycle } from "@/types/setup";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Months are clamped, so 31 Jan plus one month is 28 (or 29) Feb, not 3 Mar.
function addMonths(date: Date, months: number) {
  const next = new Date(date);
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

function addCycles(date: Date, cycle: BillingCycle, count: number) {
  switch (cycle) {
    case "Weekly": {
      const next = new Date(date);
      next.setDate(next.getDate() + 7 * count);
      return next;
    }
    case "Monthly":
      return addMonths(date, count);
    case "Quarterly":
      return addMonths(date, 3 * count);
    case "Yearly":
      return addMonths(date, 12 * count);
  }
}

// The first renewal after today, projected from the last charge on the statement.
export function projectRenewal(lastCharge: string, cycle: BillingCycle, today = new Date()) {
  const last = new Date(lastCharge);
  let count = 1;
  let next = addCycles(last, cycle, count);
  while (next <= today) {
    count += 1;
    next = addCycles(last, cycle, count);
  }
  return next.toISOString();
}

// What a charge costs per month, for the monthly totals.
export function monthlyAmount(amount: number, cycle: BillingCycle = "Monthly") {
  switch (cycle) {
    case "Weekly":
      return (amount * 52) / 12;
    case "Monthly":
      return amount;
    case "Quarterly":
      return amount / 3;
    case "Yearly":
      return amount / 12;
  }
}

// "20 Nov"
export function formatShortDate(iso: string) {
  const date = new Date(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function daysFromToday(days: number, today = new Date()) {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}
