import { isAvailableAsync, requestReview, storeUrl } from "expo-store-review";
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
