import {
  authenticateAsync,
  getEnrolledLevelAsync,
  SecurityLevel,
} from "expo-local-authentication";

// Face ID, Touch ID, a fingerprint or the phone's passcode, for App lock.

// False when the phone has no passcode and no biometrics set up, so it can't be locked.
export async function canLockApp() {
  return (await getEnrolledLevelAsync()) !== SecurityLevel.NONE;
}

// Shows the system prompt. Falls back to the phone's passcode when biometrics fail.
export async function unlockWithBiometrics(promptMessage: string) {
  const result = await authenticateAsync({ promptMessage, cancelLabel: "Cancel" });
  return result.success;
}
