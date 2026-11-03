import { useSignUp } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { AuthFooterLink } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { FlowScreen } from "@/components/FlowScreen";
import { RegionPicker } from "@/components/RegionPicker";
import { TextField } from "@/components/TextField";
import { VerifyEmail } from "@/components/VerifyEmail";
import { errorMessage } from "@/lib/clerk";
import { track } from "@/lib/posthog";
import { emailError, MIN_PASSWORD_LENGTH, passwordError } from "@/lib/validation";
import { useOnboardingStore } from "@/store/onboardingStore";
import { usePreferencesStore } from "@/store/preferencesStore";

// Create account, step 1 of 3. The country comes from the phone and can be
// changed; its currency becomes the preferred currency.
export default function SignUp() {
  const router = useRouter();
  const { signUp, errors, fetchStatus } = useSignUp();
  const region = usePreferencesStore((state) => state.region);
  const regionDetected = usePreferencesStore((state) => state.regionDetected);
  const setRegion = usePreferencesStore((state) => state.setRegion);
  const saveRegion = usePreferencesStore((state) => state.saveRegion);
  const startSetup = useOnboardingStore((state) => state.startSetup);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  // Field errors show once the user has tried to submit.
  const [submitted, setSubmitted] = useState(false);
  const loading = fetchStatus === "fetching";
  const formError = errorMessage(errors.global?.[0]);

  const createAccount = async () => {
    setSubmitted(true);
    if (emailError(email) || passwordError(password)) {
      return;
    }
    const { error } = await signUp.password({ emailAddress: email.trim(), password });
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
      await saveRegion();
      if (signUp.createdUserId) {
        startSetup(signUp.createdUserId);
      }
      track("account_created", { country: region.code });
      await signUp.finalize();
    }
  };

  const changeEmail = () => {
    signUp.reset();
    setCode("");
    setVerifying(false);
  };

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
        <RegionPicker region={region} detected={regionDetected} onChange={setRegion} />
      </View>
      {formError && <Text className="input-error">{formError}</Text>}
      <Button label="Create account" loading={loading} onPress={createAccount} className="mt-5" />
      {/* Mount point for Clerk's bot protection. */}
      <View nativeID="clerk-captcha" />
    </FlowScreen>
  );
}
