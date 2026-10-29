import { useEffect } from "react";
import { useColorScheme } from "react-native";

import { useThemeStore } from "@/store/themeStore";

export function useTheme() {
  const scheme: "light" | "dark" = useColorScheme() === "dark" ? "dark" : "light";
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);

  return { scheme, preference, setPreference };
}

// Call in the splash and onboarding screens. Restores the user's theme when they unmount.
export function useForcedDark() {
  const setForcedDark = useThemeStore((state) => state.setForcedDark);

  useEffect(() => {
    setForcedDark(true);
    return () => setForcedDark(false);
  }, [setForcedDark]);
}
