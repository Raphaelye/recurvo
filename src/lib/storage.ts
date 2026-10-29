import AsyncStorage from "@react-native-async-storage/async-storage";

// The only file that talks to AsyncStorage. Supabase replaces the repositories
// built on top of this once the frontend is done.
export function readItem(key: string) {
  return AsyncStorage.getItem(key);
}

export function writeItem(key: string, value: string) {
  return AsyncStorage.setItem(key, value);
}
