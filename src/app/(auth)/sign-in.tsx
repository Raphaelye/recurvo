import { useSignIn } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { AuthFooterLink, AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { OfflineScreen } from "@/components/OfflineScreen";
import { TextField } from "@/components/TextField";
import { VerifyEmail } from "@/components/VerifyEmail";
import { useOffline } from "@/hooks/useOffline";
import { errorMessage } from "@/lib/clerk";

export default function SignIn() {
  const router = useRouter();
  const { signIn, errors, fetchStatus } = useSignIn();
  const { offline, checking, recheck } = useOffline();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const loading = fetchStatus === "fetching";
  const formError = errorMessage(errors.global?.[0]);

  const signInWithPassword = async () => {
    const { error } = await signIn.password({ emailAddress: email.trim(), password });
    if (error) {
      return;
    }
    // Activating the session makes the root layout switch to the home route.
    if (signIn.status === "complete") {
      await signIn.finalize();
      return;
    }
    // Clerk asks for an email code when the device is new (client trust)
    // or when the account has two-step verification.
    if (signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor") {
      const { error: sendError } = await signIn.mfa.sendEmailCode();
      if (!sendError) {
        setVerifying(true);
      }
    }
  };

  const verify = async () => {
    const { error } = await signIn.mfa.verifyEmailCode({ code });
    if (error) {
      return;
    }
    if (signIn.status === "complete") {
      await signIn.finalize();
    }
  };

  const changeEmail = () => {
    signIn.reset();
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
        email={email.trim()}
        code={code}
        onChangeCode={setCode}
        error={errorMessage(errors.fields.code) ?? formError}
        loading={loading}
        onVerify={verify}
        onResend={() => signIn.mfa.sendEmailCode()}
        onChangeEmail={changeEmail}
      />
    );
  }

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Sign in to keep tracking your subscriptions."
      footer={
        <AuthFooterLink
          prompt="New to Recurvo?"
          action="Create account"
          onPress={() => router.replace("/sign-up")}
        />
      }
    >
      <View className="gap-3">
        <TextField
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          error={errorMessage(errors.fields.identifier)}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
        />
        <TextField
          label="Password"
          placeholder="Enter your password"
          password
          value={password}
          onChangeText={setPassword}
          error={errorMessage(errors.fields.password)}
          textContentType="password"
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={signInWithPassword}
        />
      </View>
      {formError && <Text className="input-error">{formError}</Text>}
      <Pressable
        accessibilityRole="link"
        hitSlop={12}
        onPress={() => router.push("/forgot-password")}
        className="mt-3 self-end active:opacity-70"
      >
        <Text className="link">Forgot password?</Text>
      </Pressable>
      <Button label="Sign in" loading={loading} onPress={signInWithPassword} className="mt-6" />
    </AuthScreen>
  );
}
