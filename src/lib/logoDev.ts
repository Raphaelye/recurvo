// Service logos from the Logo.dev image CDN, looked up by brand name.
// The publishable key (pk_) is made for client code. Every CDN request counts
// against the monthly quota, so components/ServiceLogo.tsx caches each image on
// the phone and the app never looks logos up while the user is typing.
// Only EXPO_PUBLIC_ variables reach the app bundle.
const publishableKey = process.env.EXPO_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY;

// A little over three times the 30px Home tiles show, so it stays sharp on 3x
// screens. The 16px chips scale the same image down, so each logo is fetched once.
const LOGO_PX = 96;

// Logos are optional, so the app still runs without a key.
export const logosEnabled = Boolean(publishableKey);

// Undefined without a key: logos are optional, so the app still runs without one.
// Unknown names get Logo.dev's generated monogram.
export function logoUrl(name: string, scheme: "light" | "dark") {
  if (!publishableKey) {
    return undefined;
  }
  // theme picks the version that reads on a light or dark background. It needs png or webp.
  return `https://img.logo.dev/name/${encodeURIComponent(name)}?token=${publishableKey}&size=${LOGO_PX}&format=webp&theme=${scheme}`;
}
