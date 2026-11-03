// Inline form checks, run before calling Clerk. Clerk still validates on its side.

// Must match the minimum length set in the Clerk dashboard.
export const MIN_PASSWORD_LENGTH = 15;

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function emailError(email: string) {
  return isValidEmail(email) ? undefined : "Enter a valid email address.";
}

export function passwordError(password: string) {
  return password.length >= MIN_PASSWORD_LENGTH
    ? undefined
    : `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
}
