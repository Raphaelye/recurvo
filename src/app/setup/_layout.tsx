import { Stack } from "expo-router";
import { useEffect } from "react";

import { useOnboardingStore } from "@/store/onboardingStore";

// Card setup after Create account: upload (step 2), scanning, review (step 3)
// and done. Runs on the mock parser in lib/statementParser.ts.
export default function SetupLayout() {
  const resetCard = useOnboardingStore((state) => state.resetCard);

  // Leaving setup, however it happens, deletes a statement that was picked
  // but not parsed.
  useEffect(() => resetCard, [resetCard]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Done replaced the review; swiping back to it would undo nothing. */}
      <Stack.Screen name="done" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
