import type { BillingCycle } from "@/types/setup";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

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

// The saved renewal, or, once that date has passed, the next one after it.
// Counted from the saved date each time, so month-end dates don't drift.
export function upcomingRenewal(nextRenewal: string, cycle: BillingCycle, today = new Date()) {
  const saved = new Date(nextRenewal);
  const start = startOfDay(today);
  let next = saved;
  let count = 0;
  while (next < start) {
    count += 1;
    next = addCycles(saved, cycle, count);
  }
  return next;
}

// The charge a cancelled subscription still has coming: its first renewal on or
// after the day it was cancelled. The provider takes it unless it is cancelled there too.
export function chargeAfterCancel(nextRenewal: string, cycle: BillingCycle, cancelledAt: string) {
  return upcomingRenewal(nextRenewal, cycle, new Date(cancelledAt));
}

// Midnight on the first day of today's month.
export function startOfMonth(today = new Date()) {
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

// Whole calendar days from today: 0 today, 1 tomorrow.
export function daysUntil(date: Date, today = new Date()) {
  // Rounded, because a daylight saving change makes a day 23 or 25 hours.
  return Math.round((startOfDay(date).getTime() - startOfDay(today).getTime()) / DAY_MS);
}

// What a charge costs per month, for the monthly totals.
export function monthlyAmount(amount: number, cycle: BillingCycle = "Monthly") {
  switch (cycle) {
    case "Weekly":
      return (amount * 52) / 12;
    case "Monthly":
      return amount;
    case "Yearly":
      return amount / 12;
  }
}

// "a month", for prices such as "₦15,700 a month".
export function perCycle(cycle: BillingCycle) {
  return { Weekly: "a week", Monthly: "a month", Yearly: "a year" }[cycle];
}

// "20 Nov"
export function formatShortDate(iso: string) {
  const date = new Date(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

// "Fri, 20 Nov", for a date within the next few days.
export function formatWeekdayDate(iso: string) {
  return `${WEEKDAYS[new Date(iso).getDay()]}, ${formatShortDate(iso)}`;
}

// "20 Nov 2026", where the year matters, e.g. a picked renewal date.
export function formatDate(iso: string) {
  return `${formatShortDate(iso)} ${new Date(iso).getFullYear()}`;
}

export function daysFromToday(days: number, today = new Date()) {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}
