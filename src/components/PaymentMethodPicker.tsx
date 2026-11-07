import { ArrowDown01Icon, CreditCardIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { BottomSheet } from "@/components/BottomSheet";
import { CardForm } from "@/components/CardForm";
import { Icon } from "@/components/Icon";
import { Radio } from "@/components/Radio";
import { cardKey, uniqueCards } from "@/lib/cards";
import { cn } from "@/lib/cn";
import type { PaymentCard } from "@/types/setup";

type PaymentMethodPickerProps = {
  card?: PaymentCard;
  // The cards on saved subscriptions. A card on several subscriptions is listed once.
  savedCards: PaymentCard[];
  onChange: (card: PaymentCard) => void;
  // "field": the labelled form field. "pill": the compact pill in the details modal.
  variant?: "field" | "pill";
  className?: string;
};

// "Payment method" select. The sheet lists the cards already in the app
// and lets the user add one by its name and last 4 digits.
export function PaymentMethodPicker({
  card,
  savedCards,
  onChange,
  variant = "field",
  className,
}: PaymentMethodPickerProps) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  // A card added here is not saved until the subscription is, so it is listed too.
  const cards = uniqueCards(card ? [...savedCards, card] : savedCards);

  const openSheet = () => {
    // Without cards there is nothing to pick, so the sheet opens on the form.
    setAdding(cards.length === 0);
    setOpen(true);
  };

  const choose = (picked: PaymentCard) => {
    if (!card || cardKey(picked) !== cardKey(card)) {
      Haptics.selectionAsync();
      onChange(picked);
    }
    setOpen(false);
  };

  const label = `Payment method: ${card ? `${card.name} ending ${card.last4}` : "not selected"}`;

  return (
    <View className={className}>
      {variant === "pill" ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          hitSlop={9}
          onPress={openSheet}
          className="flex-row items-center gap-1.5 rounded-full bg-foreground py-1 pl-3 pr-2 active:opacity-90"
        >
          {/* A long card name is cut short, the last 4 digits always show. */}
          <View className="shrink flex-row">
            <Text
              numberOfLines={1}
              className="shrink text-[13px] leading-[19px] font-semibold text-content"
            >
              {card ? card.name : "Select card"}
            </Text>
            {card && (
              <Text className="text-[13px] leading-[19px] font-semibold text-content">
                {` •••• ${card.last4}`}
              </Text>
            )}
          </View>
          <Icon icon={ArrowDown01Icon} size={16} className="text-content" />
        </Pressable>
      ) : (
        <>
          <Text className="field-label">Payment method</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={openSheet}
            className="min-h-[54px] flex-row items-center gap-2 rounded-md bg-foreground px-4 active:opacity-90"
          >
            <Icon
              icon={CreditCardIcon}
              size={20}
              className={card ? "text-content" : "text-neutral"}
            />
            {card ? (
              <View className="flex-1 flex-row items-center gap-2.5">
                <Text
                  numberOfLines={1}
                  className="shrink text-[16px] leading-[24px] font-normal text-content"
                >
                  {card.name}
                </Text>
                <Text className="text-[16px] leading-[24px] font-normal text-content">••••</Text>
                <Text className="text-[16px] leading-[24px] font-normal text-content">
                  {card.last4}
                </Text>
              </View>
            ) : (
              <Text className="flex-1 text-[16px] leading-[24px] font-normal text-neutral">
                Select payment method
              </Text>
            )}
            <Icon icon={ArrowDown01Icon} size={20} className="text-muted" />
          </Pressable>
        </>
      )}

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Payment method"
        subtitle="Which card pays for this?"
      >
        <ScrollView
          className="mt-4 shrink grow-0"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-2">
            {cards.map((option) => {
              const selected = !!card && cardKey(option) === cardKey(card);
              return (
                <Pressable
                  key={cardKey(option)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => choose(option)}
                  className={cn(
                    "flex-row items-center gap-3 rounded-lg px-3 py-2.5",
                    selected && "bg-card",
                  )}
                >
                  <View
                    className={cn(
                      "size-10 items-center justify-center rounded-sm",
                      selected ? "bg-foreground" : "bg-card",
                    )}
                  >
                    <Icon icon={CreditCardIcon} size={20} className="text-content" />
                  </View>
                  <View className="flex-1">
                    <Text
                      numberOfLines={1}
                      className="text-[16px] leading-[22px] font-semibold text-content"
                    >
                      {`${option.name} •••• ${option.last4}`}
                    </Text>
                    <Text className="text-[13px] leading-[19px] font-normal text-muted">
                      {option.type}
                    </Text>
                  </View>
                  <Radio selected={selected} />
                </Pressable>
              );
            })}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: adding }}
              onPress={() => setAdding(!adding)}
              className={cn(
                "flex-row items-center gap-3 rounded-lg px-3 py-2.5",
                adding && "bg-card",
              )}
            >
              <View
                className={cn(
                  "size-10 items-center justify-center rounded-sm",
                  adding ? "bg-foreground" : "bg-card",
                )}
              >
                <Icon icon={PlusSignIcon} size={20} className="text-content" />
              </View>
              <Text className="flex-1 text-[16px] leading-[22px] font-semibold text-content">
                Add a card
              </Text>
            </Pressable>

            {adding && (
              <View className="mt-2">
                <CardForm buttonLabel="Use this card" onSubmit={choose} />
              </View>
            )}
          </View>
        </ScrollView>
      </BottomSheet>
    </View>
  );
}
