import { readItem, writeItem } from "@/lib/storage";
import type { ThemePreference } from "@/types/theme";

const KEY = "theme-preference";

export async function loadThemePreference(): Promise<ThemePreference> {
  const value = await readItem(KEY);
  return value === "light" || value === "dark" ? value : "system";
}

export function saveThemePreference(preference: ThemePreference) {
  return writeItem(KEY, preference);
}
