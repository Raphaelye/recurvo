import type { ServiceCategory } from "@/types/subscription";

// The category shown under a subscription's name, by lowercase service name.
// Covers data/serviceNames.ts plus a few common extras. Anything else is "Other".
export const serviceCategories: Record<string, ServiceCategory> = {
  netflix: "Entertainment",
  spotify: "Entertainment",
  dstv: "Entertainment",
  youtube: "Entertainment",
  showmax: "Entertainment",
  gotv: "Entertainment",
  "prime video": "Entertainment",
  "disney+": "Entertainment",
  "apple music": "Entertainment",
  "apple tv+": "Entertainment",
  boomplay: "Entertainment",
  audiomack: "Entertainment",
  chatgpt: "Productivity",
  claude: "Productivity",
  notion: "Productivity",
  github: "Productivity",
  "microsoft 365": "Productivity",
  canva: "Design",
  capcut: "Design",
  figma: "Design",
  "icloud+": "Storage",
  "google one": "Storage",
  duolingo: "Education",
  starlink: "Internet",
};
