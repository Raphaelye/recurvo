// Dates in the account's own time zone: when its review is due, and the renewal
// dates the review mentions.

export type Frequency = "Weekly" | "Monthly";
export type Cycle = "Weekly" | "Monthly" | "Yearly";

// Reviews go out from 9 AM, the same hour as the phone's reminders.
const REVIEW_HOUR = 9;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 24 * 60 * 60 * 1000;

type LocalTime = { year: number; month: number; day: number; hour: number; weekday: string };

// The saved time zone, or UTC when it is missing or unknown here.
export function validTimeZone(timeZone: string | null) {
  if (!timeZone) {
    return "UTC";
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

function localTime(date: Date, timeZone: string): LocalTime {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return {
    year: Number(part("year")),
    month: Number(part("month")),
    day: Number(part("day")),
    hour: Number(part("hour")) % 24,
    weekday: part("weekday"),
  };
}

// The calendar day as a whole number, for comparing and counting days.
function dayNumber(date: Date, timeZone: string) {
  const { year, month, day } = localTime(date, timeZone);
  return Date.UTC(year, month - 1, day) / DAY_MS;
}

// Weekly: Monday, Monthly: the 1st, from 9 AM on that day. An hourly run that
// was missed is caught up by the next one, and a batch already made that day
// is not made again.
export function isDueDay(frequency: Frequency, now: Date, timeZone: string) {
  const local = localTime(now, timeZone);
  const dueDay = frequency === "Weekly" ? local.weekday === "Mon" : local.day === 1;
  return dueDay && local.hour >= REVIEW_HOUR;
}

export function sameDay(a: Date, b: Date, timeZone: string) {
  return dayNumber(a, timeZone) === dayNumber(b, timeZone);
}

export function sameMonth(a: Date, b: Date, timeZone: string) {
  const first = localTime(a, timeZone);
  const second = localTime(b, timeZone);
  return first.year === second.year && first.month === second.month;
}

// Months are clamped, so 31 Jan plus one month is 28 (or 29) Feb, as in the app.
function addCycles(date: Date, cycle: Cycle, count: number) {
  const next = new Date(date);
  if (cycle === "Weekly") {
    next.setUTCDate(next.getUTCDate() + 7 * count);
    return next;
  }
  const day = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + (cycle === "Yearly" ? 12 : 1) * count);
  const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(day, lastDay));
  return next;
}

// The saved renewal, or the next one after it once that day has passed, like
// upcomingRenewal in the app (src/lib/billing.ts).
export function nextCharge(nextRenewal: string, cycle: Cycle, now: Date, timeZone: string) {
  const saved = new Date(nextRenewal);
  const today = dayNumber(now, timeZone);
  let next = saved;
  // About 20 years of weekly charges, so a broken date can't loop forever.
  for (let count = 1; dayNumber(next, timeZone) < today && count < 1000; count += 1) {
    next = addCycles(saved, cycle, count);
  }
  return next;
}

// Whole calendar days from today: 0 today, 1 tomorrow.
export function daysUntil(date: Date, now: Date, timeZone: string) {
  return Math.round(dayNumber(date, timeZone) - dayNumber(now, timeZone));
}

// "Mon, 24 Nov", like the app's reminders.
export function formatDay(date: Date, timeZone: string) {
  const { day, month, weekday } = localTime(date, timeZone);
  return `${weekday}, ${day} ${MONTHS[month - 1]}`;
}
