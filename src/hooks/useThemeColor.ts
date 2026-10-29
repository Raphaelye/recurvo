import { useUnstableNativeVariable } from "nativewind";

// NativeWind's types describe the web build (no arguments). The native build takes the variable name.
const useVariable = useUnstableNativeVariable as unknown as (name: string) => unknown;

type ColorToken =
  | "main"
  | "card"
  | "foreground"
  | "accent"
  | "accent-text"
  | "content"
  | "muted"
  | "soft"
  | "destructive"
  | "line"
  | "neutral"
  | "on-accent"
  | "tab-bar";

// For props that take a colour value instead of a style, such as placeholderTextColor.
export function useThemeColor(token: ColorToken) {
  const value = useVariable(`--${token}`);
  return typeof value === "string" ? value : undefined;
}
