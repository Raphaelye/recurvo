import AsyncStorage from "@react-native-async-storage/async-storage";

// The only file that talks to AsyncStorage. Supabase replaces the repositories
// built on top of this once the frontend is done.
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

export async function readUserItem(key: string, userId: string) {
  const value = await readItem(userKey(key, userId));
  if (value !== null) {
    return value;
  }
  // Before 2026-11-05 this data was saved once per phone. The first account to
  // load it takes it over. Delete this with the Supabase switch.
  const legacy = await readItem(key);
  if (legacy !== null) {
    await writeItem(userKey(key, userId), legacy);
    await removeItem(key);
  }
  return legacy;
}

export function writeUserItem(key: string, userId: string, value: string) {
  return writeItem(userKey(key, userId), value);
}

// Deletes everything saved for one account, e.g. when it is deleted.
export async function removeAllUserItems(userId: string) {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((key) => key.endsWith(`:${userId}`)));
}
