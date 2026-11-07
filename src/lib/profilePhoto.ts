import { launchImageLibraryAsync } from "expo-image-picker";

// Opens the photo library with a square crop. Returns the photo as a data URI,
// which Clerk's setProfileImage takes in React Native, or undefined on cancel.
// The library picker needs no permission prompt on iOS 14+ or Android 13+.
export async function pickProfilePhoto() {
  const result = await launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });
  const photo = result.canceled ? undefined : result.assets[0];
  if (!photo?.base64) {
    return undefined;
  }
  return `data:${photo.mimeType ?? "image/jpeg"};base64,${photo.base64}`;
}
