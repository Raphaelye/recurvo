import { isAvailableAsync, requestReview, storeUrl } from "expo-store-review";
import { openBrowserAsync } from "expo-web-browser";
import { Alert, Linking } from "react-native";

import { supportEmail } from "@/data/links";

// Opens a new email to support. Without a mail app, shows the address instead.
export async function contactSupport() {
  const subject = encodeURIComponent("Recurvo support");
  try {
    await Linking.openURL(`mailto:${supportEmail}?subject=${subject}`);
  } catch {
    Alert.alert("Email us", `Write to ${supportEmail} and we’ll get back to you.`);
  }
}

// A web page such as the Privacy Policy, in an in-app browser (Safari view on
// iOS, Custom Tabs on Android), so the user stays in the app. Does nothing
// without a URL, e.g. before the landing page exists.
export function openWebPage(url: string | undefined) {
  if (url) {
    openBrowserAsync(url).catch(() => Linking.openURL(url));
  }
}

// The store's in-app rating prompt. The store decides whether it shows, so a
// tap can do nothing; the store page opens where the prompt isn't available.
export async function rateApp() {
  if (await isAvailableAsync()) {
    await requestReview();
    return;
  }
  const url = storeUrl();
  if (url) {
    await Linking.openURL(url);
  }
}
