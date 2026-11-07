// Colours for the 3D scenes, mixed from the theme tokens. Nothing here is
// hard-coded: the only colours outside the tokens are the brand colours of the
// service logos in data/services.ts.
//
// The objects (cards, holder, calendar, coins) are built from the tokens that
// are the same in light and dark (neutral, accent, on-accent), so a graphite
// card stays graphite in both themes. The coins are graphite with a polished
// steel rim and R in both themes; the bright rim keeps them apart from a black
// background. The studio they are lit by follows the theme: a dark room in dark
// mode, a light one in light mode.

export type RGB = [number, number, number];

export type Tokens = Record<"main" | "card" | "neutral" | "accent" | "onAccent", RGB>;

export type ScenePalette = {
  scheme: "light" | "dark";
  graphite: RGB;
  steel: RGB;
  chrome: RGB;
  // The coins: inner face, rim and edge, and the raised R.
  coinField: RGB;
  coinRim: RGB;
  coinMark: RGB;
  champagne: RGB;
  accent: RGB;
  accentAlt: RGB;
  accentTint: RGB;
  accentDeep: RGB;
  frost: RGB;
  paper: RGB;
  ink: RGB;
  inkSoft: RGB;
  leather: RGB;
  white: RGB;
  room: RGB;
  floor: RGB;
  lamp: RGB;
  glow: RGB;
  glowOpacity: number;
};

const BLACK: RGB = [0, 0, 0];

export function mix(a: RGB, b: RGB, amount: number): RGB {
  return [a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount, a[2] + (b[2] - a[2]) * amount];
}

function darken(color: RGB, amount: number): RGB {
  return mix(color, BLACK, amount);
}

export function derivePalette(tokens: Tokens, scheme: "light" | "dark"): ScenePalette {
  const { main, card, neutral, accent, onAccent } = tokens;
  const dark = scheme === "dark";
  // Metals reflect their base colour, so graphite is a mid grey: its darkness
  // comes from the dark parts of the studio it reflects.
  const graphite = darken(neutral, 0.42);
  const steel = mix(neutral, onAccent, 0.55);
  return {
    scheme,
    graphite,
    steel,
    chrome: mix(neutral, onAccent, 0.85),
    coinField: graphite,
    coinRim: steel,
    coinMark: steel,
    // Muted pale gold for the card chips: Accent Alt with white and grey.
    champagne: mix(mix(mix(accent, onAccent, 0.3), onAccent, 0.4), neutral, 0.2),
    accent,
    // Accent Alt (#eb9f6f in Figma): accent with 30% white.
    accentAlt: mix(accent, onAccent, 0.3),
    // Highlighter on paper.
    accentTint: mix(accent, onAccent, 0.72),
    accentDeep: darken(accent, 0.4),
    frost: mix(onAccent, neutral, 0.1),
    paper: mix(onAccent, neutral, 0.03),
    ink: darken(neutral, 0.78),
    inkSoft: mix(neutral, onAccent, 0.4),
    leather: darken(neutral, 0.62),
    white: onAccent,
    room: dark ? mix(card, neutral, 0.16) : mix(main, neutral, 0.3),
    floor: dark ? mix(main, neutral, 0.06) : mix(card, neutral, 0.1),
    lamp: onAccent,
    glow: accent,
    glowOpacity: dark ? 0.2 : 0.07,
  };
}

// Accepts "#rgb", "#rrggbb" and "rgb(r g b)" or "rgb(r, g, b)". Channels are 0 to 1.
export function parseColor(value: string | undefined): RGB {
  if (!value) {
    return BLACK;
  }
  const hex = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const digits = hex[1].length === 3 ? hex[1].replace(/./g, (d) => d + d) : hex[1];
    return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16) / 255) as RGB;
  }
  const rgb = value.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  return rgb ? [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255] : BLACK;
}

export function toHex(color: RGB) {
  return `#${color
    .map((channel) =>
      Math.round(Math.min(1, Math.max(0, channel)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
