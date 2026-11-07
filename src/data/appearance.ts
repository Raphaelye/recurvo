import type { ThemePreference } from "@/types/theme";

export type AppearanceOption = {
  preference: ThemePreference;
  title: string;
  description: string;
};

export const appearanceOptions: AppearanceOption[] = [
  {
    preference: "system",
    title: "System",
    description: "Match your phone’s light or dark setting",
  },
  { preference: "light", title: "Light", description: "Always use the light theme" },
  { preference: "dark", title: "Dark", description: "Always use the dark theme" },
];
