import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import { Button } from "@/components/Button";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { PaymentCard } from "@/types/setup";

type CardFormProps = {
  buttonLabel: string;
  onSubmit: (card: PaymentCard) => void;
  loading?: boolean;
};

// A card entered by hand: its name and last 4 digits, never the full number.
// Sits inside a bottom sheet, so the fields use the card inset colour.
export function CardForm({ buttonLabel, onSubmit, loading = false }: CardFormProps) {
  const placeholderColor = useThemeColor("neutral");
  const [name, setName] = useState("");
  const [last4, setLast4] = useState("");
  const ready = name.trim().length > 0 && /^\d{4}$/.test(last4);

  // Like the upload fallback, a card entered by hand is saved as a debit card.
  const submit = () => onSubmit({ name: name.trim(), last4, type: "Debit" });

  return (
    <View className="gap-4">
      <View>
        <Text className="input-label">Card name</Text>
        <TextInput
          accessibilityLabel="Card name"
          placeholder="e.g. GTBank Visa"
          placeholderTextColor={placeholderColor}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoCorrect={false}
          className="min-h-[54px] rounded-md bg-card px-4 py-3 text-[16px] leading-[22px] font-normal text-content"
        />
      </View>
      <View>
        <Text className="input-label">Last 4 digits</Text>
        <TextInput
          accessibilityLabel="Last 4 digits"
          placeholder="1234"
          placeholderTextColor={placeholderColor}
          value={last4}
          onChangeText={(text) => setLast4(text.replace(/\D/g, ""))}
          keyboardType="number-pad"
          maxLength={4}
          className="min-h-[54px] rounded-md bg-card px-4 py-3 text-[16px] leading-[22px] font-normal text-content"
        />
      </View>
      <Button label={buttonLabel} onPress={submit} disabled={!ready} loading={loading} />
    </View>
  );
}
