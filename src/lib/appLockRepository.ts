import { readItem, writeItem } from "@/lib/storage";

const KEY = "app-lock";

// App lock belongs to the phone, not the account: it protects whoever is signed in on it.
export async function loadAppLock() {
  return (await readItem(KEY)) === "on";
}

export function saveAppLock(enabled: boolean) {
  return writeItem(KEY, enabled ? "on" : "off");
}
