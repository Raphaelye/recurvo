import { useSignIn } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { AuthFooterLink } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { FlowScreen } from "@/components/FlowScreen";
import { TextField } from "@/components/TextField";
import { errorMessage } from "@/lib/clerk";
import { emailError, MIN_PASSWORD_LENGTH, passwordError } from "@/lib/validation";

// Reset password with Clerk's email code: send a code, then enter it with a new
// password. A finished reset signs the user in.
export default function ForgotPassword() {
  const router = useRouter();
  const { signIn, errors, fetchStatus } = useSignIn();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "reset">("email");
  const [submitted, setSubmitted] = useState(false);
  const loading = fetchStatus === "fetching";
  const formError = errorMessage(errors.global?.[0]);

  const backToSignIn = () => (router.canGoBack() ? router.back() : router.replace("/sign-in"));
  const footer = (
    <View className="px-screen pb-2 pt-4">
      <AuthFooterLink prompt="Remembered it?" action="Back to sign in" onPress={backToSignIn} />
    </View>
  );

  const sendCode = async () => {
    setSubmitted(true);
    if (emailError(email)) {
      return;
    }
    const { error } = await signIn.create({ identifier: email.trim() });
    if (error) {
      return;
    }
    const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
    if (!sendError) {
      setSubmitted(false);
      setStep("reset");
    }
  };

  const resetPassword = async () => {
    setSubmitted(true);
    if (code.length !== 6 || passwordError(password)) {
      return;
    }
    // A rejected new password keeps the verified code, so it is not checked twice.
    if (signIn.status !== "needs_new_password") {
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code });
      if (error) {
        return;
      }
    }
    const { error } = await signIn.resetPasswordEmailCode.submitPassword({ password });
    if (error) {
      return;
    }
    // Activating the session makes the root layout switch to the home route.
    if (signIn.status === "complete") {
      await signIn.finalize();
    }
  };

  const changeEmail = () => {
    signIn.reset();
    setCode("");
    setPassword("");
    setSubmitted(false);
    setStep("email");
  };

  if (step === "reset") {
    return (
      <FlowScreen
        title="Choose a new password"
        subtitle={`Enter the 6-digit code we sent to ${email.trim()} and your new password.`}
        onBack={changeEmail}
        footer={footer}
      >
        <View className="gap-4">
          <TextField
            label="Reset code"
            placeholder="6-digit code"
            value={code}
            onChangeText={setCode}
            error={
              (submitted && code.length !== 6 ? "Enter the 6-digit code." : undefined) ??
              errorMessage(errors.fields.code)
            }
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
          />
          <TextField
            label="New password"
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            password
            value={password}
            onChangeText={setPassword}
            error={
              (submitted ? passwordError(password) : undefined) ??
              errorMessage(errors.fields.password)
            }
            textContentType="newPassword"
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={resetPassword}
          />
        </View>
        {formError && <Text className="input-error">{formError}</Text>}
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => signIn.resetPasswordEmailCode.sendCode()}
          className="mt-3 self-end"
        >
          <Text className="link">Resend code</Text>
        </Pressable>
        <Button label="Reset password" loading={loading} onPress={resetPassword} className="mt-6" />
      </FlowScreen>
    );
  }

  return (
    <FlowScreen
      title="Reset your password"
      subtitle="Enter the email you signed up with and we will send you a code to choose a new password."
      footer={footer}
    >
      <TextField
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        error={
          (submitted ? emailError(email) : undefined) ?? errorMessage(errors.fields.identifier)
        }
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="go"
        onSubmitEditing={sendCode}
      />
      {formError && <Text className="input-error">{formError}</Text>}
      <Button label="Send reset code" loading={loading} onPress={sendCode} className="mt-6" />
    </FlowScreen>
  );
}
