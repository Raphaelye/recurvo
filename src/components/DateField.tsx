import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { Calendar04Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { useTheme } from "@/hooks/useTheme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatDate } from "@/lib/billing";
import { cn } from "@/lib/cn";

type DateFieldProps = {
  label: string;
  // ISO date. Undefined until a date is picked.
  value?: string;
  onChange: (iso: string) => void;
};

function startOfDay(date: Date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

// Date select field with the phone's own picker, from today on. iOS shows the
// calendar in a bottom sheet with a Done button. Android opens its date dialog.
export function DateField({ label, value, onChange }: DateFieldProps) {
  const { scheme } = useTheme();
  const accent = useThemeColor("accent");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => startOfDay(new Date()));
  const today = startOfDay(new Date());

  const openPicker = () => {
    setDraft(value ? new Date(value) : today);
    setOpen(true);
  };

  const pick = (date: Date) => {
    setOpen(false);
    onChange(startOfDay(date).toISOString());
  };

  return (
    <View>
      <Text className="field-label">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDate(value) : "not set"}`}
        onPress={openPicker}
        className="min-h-[54px] flex-row items-center justify-between gap-3 rounded-md bg-foreground px-4 active:opacity-90"
      >
        <Text
          className={cn(
            "text-[16px] leading-[24px] font-normal",
            value ? "text-content" : "text-neutral",
          )}
        >
          {value ? formatDate(value) : "Select date"}
        </Text>
        <Icon icon={Calendar04Icon} size={20} className="text-muted" />
      </Pressable>

      {Platform.OS === "android" ? (
        // The dialog opens when it mounts, so it is only rendered while open.
        open && (
          <DateTimePicker
            value={draft}
            minimumDate={today}
            accentColor={accent}
            themeVariant={scheme}
            onValueChange={(_, date) => pick(date)}
            onDismiss={() => setOpen(false)}
          />
        )
      ) : (
        <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
          <DateTimePicker
            value={draft}
            display="inline"
            minimumDate={today}
            accentColor={accent}
            themeVariant={scheme}
            onValueChange={(_, date) => setDraft(date)}
          />
          <Button label="Done" onPress={() => pick(draft)} className="mt-4" />
        </BottomSheet>
      )}
    </View>
  );
}
