import { useEffect, useState } from "react";
import { AppState } from "react-native";

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

// Today's date, for day counts such as "3 Days Left". It moves to the new day when
// the app comes back to the foreground, or at midnight while it stays open, so a
// screen kept in memory overnight doesn't show yesterday's counts.
export function useToday() {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    // Keeps the same date on the same day, so nothing re-renders for nothing.
    const refresh = () => {
      const now = new Date();
      setToday((current) => (isSameDay(current, now) ? current : now));
    };

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        refresh();
      }
    });

    // A second past midnight, in case the clock fires a little early.
    const midnight = new Date(today);
    midnight.setHours(24, 0, 1, 0);
    const timer = setTimeout(refresh, midnight.getTime() - Date.now());

    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, [today]);

  return today;
}
