import { useAuth, useSignUp } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { AuthFooterLink } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { FlowScreen } from "@/components/FlowScreen";
import { OfflineScreen } from "@/components/OfflineScreen";
import { PreferredCurrencyPicker } from "@/components/PreferredCurrencyPicker";
import { TextField } from "@/components/TextField";
import { VerifyEmail } from "@/components/VerifyEmail";
import { useOffline } from "@/hooks/useOffline";
import { errorMessage } from "@/lib/clerk";
import { track } from "@/lib/posthog";
import { emailError, MIN_PASSWORD_LENGTH, nameError, passwordError } from "@/lib/validation";
import { useOnboardingStore } from "@/store/onboardingStore";
import { usePreferencesStore } from "@/store/preferencesStore";

// Create account, step 1 of 3. The country comes from the phone and can be
// changed; its currency becomes the preferred currency.
export default function SignUp() {
  const router = useRouter();
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const currency = usePreferencesStore((state) => state.currency);
  const currencyDetected = usePreferencesStore((state) => state.currencyDetected);
  const setCurrency = usePreferencesStore((state) => state.setCurrency);
  const saveCurrency = usePreferencesStore((state) => state.saveCurrency);
  const startSetup = useOnboardingStore((state) => state.startSetup);
  const { offline, checking, recheck } = useOffline();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  // Field errors show once the user has tried to submit.
  const [submitted, setSubmitted] = useState(false);
  // Still here once signed in: the root layout is loading the account's data.
  const loading = fetchStatus === "fetching" || isSignedIn === true;
  const formError = errorMessage(errors.global?.[0]);

  const createAccount = async () => {
    setSubmitted(true);
    if (
      nameError(firstName, "first") ||
      nameError(lastName, "last") ||
      emailError(email) ||
      passwordError(password)
    ) {
      return;
    }
    // "First and last name" must be turned on in the Clerk dashboard, or Clerk rejects them.
    const { error } = await signUp.password({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      emailAddress: email.trim(),
      password,
    });
    if (error) {
      return;
    }
    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (!sendError) {
      setVerifying(true);
    }
  };

  const verify = async () => {
    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) {
      return;
    }
    // Activating the session makes the root layout leave the auth screens.
    // startSetup sends the new user on to step 2 instead of Home.
    if (signUp.status === "complete") {
      const userId = signUp.createdUserId;
      if (userId) {
        startSetup(userId);
      }
      track("account_created", { currency: currency.code });
      await signUp.finalize();
      // Supabase only accepts signed-in requests, so this waits for the new session.
      if (userId) {
        await saveCurrency(userId);
      }
    }
  };

  const changeEmail = () => {
    signUp.reset();
    setCode("");
    setVerifying(false);
  };

  // Clerk needs the internet. What was typed stays for when the connection is back.
  if (offline) {
    return <OfflineScreen checking={checking} onRetry={recheck} />;
  }

  if (verifying) {
    return (
      <VerifyEmail
        layout="flow"
        email={email.trim()}
        code={code}
        onChangeCode={setCode}
        error={errorMessage(errors.fields.code) ?? formError}
        loading={loading}
        onVerify={verify}
        onResend={() => signUp.verifications.sendEmailCode()}
        onChangeEmail={changeEmail}
      />
    );
  }

  return (
    <FlowScreen
      title="Create your account"
      subtitle="One minute, then upload a statement and we find your subscriptions for you."
      footer={
        <View className="gap-3 px-screen pb-2 pt-4">
          <Text className="px-4 text-center text-[13px] leading-[19px] font-normal text-soft">
            By continuing you agree to our Terms of Service and Privacy Policy.
          </Text>
          <AuthFooterLink
            prompt="Already have an account?"
            action="Sign in"
            onPress={() => router.replace("/sign-in")}
          />
        </View>
      }
    >
      <View className="gap-4">
        <TextField
          label="First name"
          placeholder="Clever"
          value={firstName}
          onChangeText={setFirstName}
          error={
            (submitted ? nameError(firstName, "first") : undefined) ??
            errorMessage(errors.fields.firstName)
          }
          textContentType="givenName"
          autoComplete="given-name"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
        />
        <TextField
          label="Last name"
          placeholder="Raph"
          value={lastName}
          onChangeText={setLastName}
          error={
            (submitted ? nameError(lastName, "last") : undefined) ??
            errorMessage(errors.fields.lastName)
          }
          textContentType="familyName"
          autoComplete="family-name"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
        />
        <TextField
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          error={(submitted ? emailError(email) : undefined) ?? errorMessage(errors.fields.emailAddress)}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
        />
        <TextField
          label="Password"
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          password
          value={password}
          onChangeText={setPassword}
          error={
            (submitted ? passwordError(password) : undefined) ?? errorMessage(errors.fields.password)
          }
          textContentType="newPassword"
          autoComplete="new-password"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={createAccount}
        />
        <PreferredCurrencyPicker
          currency={currency}
          detected={currencyDetected}
          onChange={setCurrency}
        />
      </View>
      {formError && <Text className="input-error">{formError}</Text>}
      <Button label="Create account" loading={loading} onPress={createAccount} className="mt-5" />
      {/* Mount point for Clerk's bot protection. */}
      <View nativeID="clerk-captcha" />
    </FlowScreen>
  );
}
