import { Cancel01Icon, CreditCardIcon, Csv01Icon, Pdf01Icon, Upload04Icon } from "@hugeicons/core-free-icons";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { AccentTint } from "@/components/AccentTint";
import { CheckCircle } from "@/components/CheckCircle";
import { Icon } from "@/components/Icon";
import { TextField } from "@/components/TextField";
import type { PaymentCard, StatementFile } from "@/types/setup";

// The pieces of the "Add your card with a statement" step.

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropzone({ onPress, error }: { onPress: () => void; error?: string }) {
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose a statement file, PDF or CSV up to 10 MB"
        onPress={onPress}
        className="items-center rounded-xl border-[1.5px] border-dashed border-neutral bg-foreground py-6 active:opacity-90"
      >
        <AccentTint className="size-14 rounded-full">
          <Icon icon={Upload04Icon} size={24} className="text-accent-text" />
        </AccentTint>
        <Text className="mt-3 text-[16px] leading-[24px] font-semibold text-content">
          Tap to choose a file
        </Text>
        <Text className="mt-1 text-[13px] leading-[19px] font-normal text-muted">
          PDF or CSV · up to 10 MB
        </Text>
      </Pressable>
      {error && <Text className="input-error">{error}</Text>}
    </View>
  );
}

export function FileRow({ file, onRemove }: { file: StatementFile; onRemove: () => void }) {
  return (
    <View className="flex-row items-center gap-3 rounded-xl bg-foreground p-3.5">
      <View className="size-11 items-center justify-center rounded-md bg-card">
        <Icon icon={file.kind === "pdf" ? Pdf01Icon : Csv01Icon} size={22} className="text-accent-text" />
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className="text-[16px] leading-[24px] font-semibold text-content">
          {file.name}
        </Text>
        <Text className="text-[13px] leading-[19px] font-normal text-muted">
          {`${formatSize(file.size)} · Ready to scan`}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ${file.name}`}
        hitSlop={6}
        onPress={onRemove}
        className="size-8 items-center justify-center rounded-full bg-card active:opacity-90"
      >
        <Icon icon={Cancel01Icon} size={16} className="text-content" />
      </Pressable>
    </View>
  );
}

type DetectedCardProps = {
  status: "reading" | "found" | "failed";
  card?: PaymentCard;
  // Manual fallback when the header could not be read.
  manualName: string;
  manualLast4: string;
  onChangeName: (name: string) => void;
  onChangeLast4: (last4: string) => void;
  last4Error?: string;
};

// Card details read from the statement header. If they cannot be read, the
// user types a nickname and the last 4 digits instead (never the full number).
export function DetectedCard({
  status,
  card,
  manualName,
  manualLast4,
  onChangeName,
  onChangeLast4,
  last4Error,
}: DetectedCardProps) {
  if (status === "failed") {
    return (
      <View className="gap-4">
        <Text className="text-[13px] leading-[19px] font-normal text-muted">
          We couldn’t read the card on this statement. Add its name and last 4 digits.
        </Text>
        <TextField
          label="Card nickname"
          placeholder="e.g. Chipper Visa"
          value={manualName}
          onChangeText={onChangeName}
          autoCapitalize="words"
        />
        <TextField
          label="Last 4 digits"
          placeholder="e.g. 4417"
          value={manualLast4}
          onChangeText={(text) => onChangeLast4(text.replace(/\D/g, ""))}
          keyboardType="number-pad"
          maxLength={4}
          error={last4Error}
        />
      </View>
    );
  }

  return (
    <View
      accessibilityLiveRegion="polite"
      className="min-h-[72px] flex-row items-center gap-3 rounded-xl bg-foreground p-3.5"
    >
      <View className="size-11 items-center justify-center rounded-md bg-card">
        <Icon icon={CreditCardIcon} size={22} className="text-content" />
      </View>
      {status === "reading" || !card ? (
        <>
          <Text className="flex-1 text-[15px] leading-[22px] font-normal text-muted">
            Reading card details…
          </Text>
          <ActivityIndicator className="text-accent" />
        </>
      ) : (
        <>
          <View className="flex-1">
            <Text className="text-[11px] leading-[16px] font-bold uppercase tracking-[0.8px] text-accent-text">
              Card detected
            </Text>
            <Text numberOfLines={1} className="text-[16px] leading-[24px] font-semibold text-content">
              {`${card.name} •••• ${card.last4} · ${card.type}`}
            </Text>
          </View>
          <CheckCircle className="size-[26px]" />
        </>
      )}
    </View>
  );
}
