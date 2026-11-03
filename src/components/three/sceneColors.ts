import { useMemo } from "react";

import { useTheme } from "@/hooks/useTheme";
import { useThemeColor } from "@/hooks/useThemeColor";

import { derivePalette, parseColor, type ScenePalette } from "./palette";

// Three.js and SVG cannot read NativeWind classes, so the 3D scene and its SVG
// fallback get their colours from the theme tokens here. The mixing is in
// palette.ts. Changes when the user or the system switches theme.
export function useSceneColors(): ScenePalette {
  const { scheme } = useTheme();
  const main = useThemeColor("main");
  const card = useThemeColor("card");
  const neutral = useThemeColor("neutral");
  const accent = useThemeColor("accent");
  const onAccent = useThemeColor("on-accent");

  return useMemo(
    () =>
      derivePalette(
        {
          main: parseColor(main),
          card: parseColor(card),
          neutral: parseColor(neutral),
          accent: parseColor(accent),
          onAccent: parseColor(onAccent),
        },
        scheme,
      ),
    [scheme, main, card, neutral, accent, onAccent],
  );
}
