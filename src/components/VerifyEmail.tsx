import { Pressable, Text, View } from "react-native";

import { AuthFooterLink, AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
import { FlowScreen } from "@/components/FlowScreen";
import { TextField } from "@/components/TextField";

type VerifyEmailProps = {
  email: string;
  code: string;
  onChangeCode: (code: string) => void;
  error?: string;
  loading: boolean;
  onVerify: () => void;
  onResend: () => void;
  onChangeEmail: () => void;
  // Sign-up shows it as part of the numbered flow, sign-in as an auth screen.
  layout?: "auth" | "flow";
};

// Code step shared by sign-up (new email) and sign-in (new device).
export function VerifyEmail({
  email,
  code,
  onChangeCode,
  error,
  loading,
  onVerify,
  onResend,
  onChangeEmail,
  layout = "auth",
}: VerifyEmailProps) {
  const title = "Check your email";
  const subtitle = `Enter the 6-digit code we sent to ${email}.`;
  const footer = <AuthFooterLink prompt="Wrong email?" action="Go back" onPress={onChangeEmail} />;
  const form = (
    <>
      <TextField
        label="Verification code"
        placeholder="6-digit code"
        value={code}
        onChangeText={onChangeCode}
        error={error}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={onVerify}
      />
      <Pressable accessibilityRole="button" hitSlop={12} onPress={onResend} className="mt-3 self-end active:opacity-70">
        <Text className="link">Resend code</Text>
      </Pressable>
      <Button label="Verify" loading={loading} onPress={onVerify} className="mt-6" />
    </>
  );

  if (layout === "flow") {
    return (
      <FlowScreen
        title={title}
        subtitle={subtitle}
        onBack={onChangeEmail}
        footer={<View className="px-screen pb-2 pt-4">{footer}</View>}
      >
        {form}
      </FlowScreen>
    );
  }

  return (
    <AuthScreen title={title} subtitle={subtitle} footer={footer}>
      {form}
    </AuthScreen>
  );
}
