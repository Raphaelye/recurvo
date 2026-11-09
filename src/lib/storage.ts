import AsyncStorage from "@react-native-async-storage/async-storage";

// The only file that talks to AsyncStorage. It keeps data that belongs to the
// phone, and a copy of each account's Supabase data.
export function readItem(key: string) {
  return AsyncStorage.getItem(key);
}

export function writeItem(key: string, value: string) {
  return AsyncStorage.setItem(key, value);
}

export function removeItem(key: string) {
  return AsyncStorage.removeItem(key);
}

// Data that belongs to one account is saved under "<key>:<Clerk user id>", so
// two accounts on the same phone never see each other's data. Data that belongs
// to the phone (theme, cached exchange rates) uses the plain functions above.
function userKey(key: string, userId: string) {
  return `${key}:${userId}`;
}

// The copy of an account's Supabase data, so the app opens straight away and
// still shows it offline. Undefined when this phone has never loaded it.
export async function readCopy<T>(key: string, userId: string): Promise<T | undefined> {
  try {
    const value = await readItem(userKey(key, userId));
    return value === null ? undefined : (JSON.parse(value) as T);
  } catch {
    // An unreadable copy counts as none: the app loads it from Supabase instead.
    return undefined;
  }
}

export async function writeCopy(key: string, userId: string, value: unknown) {
  try {
    await writeItem(userKey(key, userId), JSON.stringify(value));
  } catch {
    // Only a copy: the next load from Supabase writes it again.
  }
}

// Deletes everything saved for one account, e.g. on sign-out or account deletion.
export async function removeAllUserItems(userId: string) {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((key) => key.endsWith(`:${userId}`)));
}
