import { Stack } from "expo-router";

// Signed-out screens. The root layout keeps signed-in users out of this group.
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}
