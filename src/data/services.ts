import { CapcutIcon, ChatGptIcon, FigmaIcon, SpotifyIcon, YoutubeIcon } from "@hugeicons/core-free-icons";

// The subscriptions on the coins in the onboarding 3D scenes.

// Hugeicons data: [tag, attributes] pairs drawn in a 24 x 24 box.
export type IconData = readonly (readonly [string, { readonly [key: string]: string | number }])[];

// How one element of the icon is drawn on the coin: filled, or as a raised
// stroke (width in icon units, defaults to the icon's own). null skips the
// element, e.g. Spotify's outline circle, which is the coin's enamel instead.
export type LogoPart = { color: string; fill?: boolean; width?: number } | null;

export type ServiceId = "capcut" | "youtube" | "spotify" | "netflix" | "figma" | "chatgpt";

export type Service = {
  id: ServiceId;
  name: string;
  // Hugeicons brand mark. Netflix is not in the free set: its N is modelled in
  // the scene (components/three/models/logos.ts) from `parts`.
  icon: IconData | null;
  // Brand colours: the enamel behind the mark, then one part per icon element.
  // These are the only colours in the app outside the theme tokens (approved
  // 2026-11-03, the logos are only recognisable in their own colours).
  enamel: string;
  parts: LogoPart[];
  // Day of the month the welcome calendar flips to when this coin comes round.
  renewalDay: number;
};

// In renewal order, so the calendar dates count up as the coins come round.
export const services: Service[] = [
  {
    id: "capcut",
    name: "CapCut",
    icon: CapcutIcon,
    enamel: "#000000",
    parts: [{ color: "#ffffff", width: 1.9 }],
    renewalDay: 3,
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: YoutubeIcon,
    enamel: "#ffffff",
    parts: [
      { color: "#ff0000", fill: true },
      { color: "#ffffff", fill: true },
    ],
    renewalDay: 7,
  },
  {
    id: "spotify",
    name: "Spotify",
    icon: SpotifyIcon,
    enamel: "#1ed760",
    parts: [null, { color: "#121212", width: 2.1 }],
    renewalDay: 12,
  },
  {
    id: "netflix",
    name: "Netflix",
    icon: null,
    enamel: "#000000",
    // The diagonal, then the two uprights behind it.
    parts: [{ color: "#e50914" }, { color: "#b1060f" }],
    renewalDay: 18,
  },
  {
    id: "figma",
    name: "Figma",
    icon: FigmaIcon,
    enamel: "#1e1e1e",
    parts: [
      { color: "#1abcfe", fill: true },
      { color: "#0acf83", fill: true },
      { color: "#a259ff", fill: true },
      { color: "#f24e1e", fill: true },
      { color: "#ff7262", fill: true },
    ],
    renewalDay: 24,
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: ChatGptIcon,
    enamel: "#ffffff",
    parts: Array.from({ length: 6 }, () => ({ color: "#000000", width: 1.7 })),
    renewalDay: 28,
  },
];
