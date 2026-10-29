import { useSignUp } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { AuthFooterLink, AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { VerifyEmail } from "@/components/VerifyEmail";
import { errorMessage } from "@/lib/clerk";

export default function SignUp() {
  const router = useRouter();
  const { signUp, errors, fetchStatus } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const loading = fetchStatus === "fetching";
  const formError = errorMessage(errors.global?.[0]);

  const createAccount = async () => {
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
    // Activating the session makes the root layout switch to the home route.
    if (signUp.status === "complete") {
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
    <AuthScreen
      title="Create your account"
      subtitle="Track every subscription in one place."
      footer={
        <>
          {/* px-6 keeps the line break after "and", as in the design. */}
          <Text className="px-6 text-center text-[13px] leading-[19px] font-normal text-muted">
            By continuing you agree to our <Text className="text-content">Terms of Service</Text>{" "}
            and <Text className="text-content">Privacy Policy</Text>.
          </Text>
          <View className="mt-6">
            <AuthFooterLink
              prompt="Already have an account?"
              action="Sign in"
              onPress={() => router.replace("/sign-in")}
            />
          </View>
        </>
      }
    >
      <View className="gap-4">
        <TextField
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          error={errorMessage(errors.fields.emailAddress)}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
        />
        <TextField
          label="Password"
          placeholder="At least 15 characters"
          password
          value={password}
          onChangeText={setPassword}
          error={errorMessage(errors.fields.password)}
          textContentType="newPassword"
          autoComplete="new-password"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={createAccount}
        />
      </View>
      {formError && <Text className="input-error">{formError}</Text>}
      <Button label="Create account" loading={loading} onPress={createAccount} className="mt-7" />
      {/* Mount point for Clerk's bot protection. */}
      <View nativeID="clerk-captcha" />
    </AuthScreen>
  );
}
