// The publishable key is safe in the app. Clerk's secret key only lives in Supabase.
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to the .env file");
}

export const clerkPublishableKey = publishableKey;

type ClerkErrorLike = { message: string; longMessage?: string } | null | undefined;

// longMessage is written for users. message is meant for developers, so it is only a fallback.
export function errorMessage(error: ClerkErrorLike) {
  return error ? (error.longMessage ?? error.message) : undefined;
}
