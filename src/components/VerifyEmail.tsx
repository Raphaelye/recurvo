import { Pressable, Text } from "react-native";

import { AuthFooterLink, AuthScreen } from "@/components/AuthScreen";
import { Button } from "@/components/Button";
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
}: VerifyEmailProps) {
  return (
    <AuthScreen
      title="Check your email"
      subtitle={`Enter the 6-digit code we sent to ${email}.`}
      footer={<AuthFooterLink prompt="Wrong email?" action="Go back" onPress={onChangeEmail} />}
    >
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
      <Pressable accessibilityRole="button" hitSlop={12} onPress={onResend} className="mt-3 self-end">
        <Text className="link">Resend code</Text>
      </Pressable>
      <Button label="Verify" loading={loading} onPress={onVerify} className="mt-6" />
    </AuthScreen>
  );
}
