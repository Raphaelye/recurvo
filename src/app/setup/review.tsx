import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { LayoutAnimationConfig } from "react-native-reanimated";

import { AccentTint } from "@/components/AccentTint";
import { BottomSheet } from "@/components/BottomSheet";
import { Button } from "@/components/Button";
import { DetectedSubRow } from "@/components/DetectedSubRow";
import { FlowFooter, FlowScreen } from "@/components/FlowScreen";
import { Icon } from "@/components/Icon";
import { InlineNote } from "@/components/InlineNote";
import { SegmentedControl } from "@/components/SegmentedControl";
import { billingCycles } from "@/data/setup";
import { daysFromToday, formatShortDate, monthlyAmount, projectRenewal } from "@/lib/billing";
import { cn } from "@/lib/cn";
import { formatAmount } from "@/lib/currency";
import { track } from "@/lib/posthog";
import { useOnboardingStore } from "@/store/onboardingStore";
import { usePreferencesStore } from "@/store/preferencesStore";
import type { BillingCycle, ReviewItem } from "@/types/setup";

// Days the user can move the projected renewal by, either way.
const RENEWAL_SHIFT_DAYS = 7;

// Step 3 of 3: confirm what to track and how often each one bills.
export default function Review() {
  const router = useRouter();
  const items = useOnboardingStore((state) => state.items);
  const card = useOnboardingStore((state) => state.card);
  const preferred = usePreferencesStore((state) => state.currency);
  const toggleTracked = useOnboardingStore((state) => state.toggleTracked);
  const updateItem = useOnboardingStore((state) => state.updateItem);
  const saveTracked = useOnboardingStore((state) => state.saveTracked);
  const [sheetOpen, setSheetOpen] = useState(false);
  // Kept after the sheet closes, so its text does not change while it fades out.
  const [editingId, setEditingId] = useState<string>();
  const [draftCycle, setDraftCycle] = useState<BillingCycle>("Monthly");
  const [draftRenewal, setDraftRenewal] = useState("");
  const [pickingDate, setPickingDate] = useState(false);
  // Ticking a row without a cycle opens the sheet; saving then ticks it.
  const [trackOnSave, setTrackOnSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const editing = items.find((item) => item.id === editingId);

  const trackedCount = items.filter((item) => item.tracked).length;
  const readyCount = items.filter((item) => item.cycle).length;
  const total = items.reduce((sum, item) => sum + monthlyAmount(item.amount, item.cycle), 0);

  const openCycle = (item: ReviewItem, tickOnSave = false) => {
    setEditingId(item.id);
    setDraftCycle(item.cycle ?? "Monthly");
    setDraftRenewal(item.nextRenewal);
    setPickingDate(false);
    setTrackOnSave(tickOnSave);
    setSheetOpen(true);
  };

  const toggle = (item: ReviewItem) => {
    if (!item.tracked && !item.cycle) {
      openCycle(item, true);
      return;
    }
    toggleTracked(item.id);
  };

  const changeCycle = (cycle: BillingCycle) => {
    setDraftCycle(cycle);
    if (editing) {
      setDraftRenewal(projectRenewal(editing.lastCharge, cycle));
    }
  };

  const saveCycle = () => {
    if (editing) {
      updateItem(editing.id, {
        cycle: draftCycle,
        nextRenewal: draftRenewal,
        tracked: editing.tracked || trackOnSave,
      });
    }
    setSheetOpen(false);
  };

  const confirm = async () => {
    setSaving(true);
    // Not saved: the store has told the user, and they can confirm again.
    if (!(await saveTracked())) {
      setSaving(false);
      return;
    }
    track("subscriptions_confirmed", { count: trackedCount });
    router.replace("/setup/done");
  };

  // Dates around the projected renewal, never in the past.
  const projected = editing ? projectRenewal(editing.lastCharge, draftCycle) : draftRenewal;
  const renewalOptions = Array.from({ length: RENEWAL_SHIFT_DAYS * 2 + 1 }, (_, i) =>
    daysFromToday(i - RENEWAL_SHIFT_DAYS, new Date(projected)),
  ).filter((date) => new Date(date) > new Date());

  return (
    <FlowScreen
      title={
        items.length === 0
          ? "No subscriptions found"
          : `We found ${items.length} subscription${items.length === 1 ? "" : "s"}`
      }
      subtitle={
        items.length === 0
          ? "We couldn’t spot repeating charges on this statement. Try one with 3 to 6 months, or add them yourself."
          : `From your ${card?.name ?? "card"} •••• ${card?.last4 ?? ""} statement. Set each billing cycle and confirm what to track.`
      }
      footer={
        <FlowFooter
          button={{
            label: `Track ${trackedCount} subscription${trackedCount === 1 ? "" : "s"}`,
            onPress: confirm,
            disabled: trackedCount === 0,
            loading: saving,
          }}
          // Saving the form comes back here.
          link={{
            label: "Add one manually",
            onPress: () => {
              track("manual_fallback_used", { from: "review" });
              router.push("/add-subscription");
            },
          }}
        />
      }
    >
      <View className="flex-row items-center justify-between gap-3 rounded-xl bg-foreground p-4">
        <View className="shrink">
          <Text className="text-[13px] leading-[19px] font-normal text-muted">
            Estimated monthly spend
          </Text>
          <Text className="text-[12px] leading-[16px] font-normal text-soft">
            {`${readyCount} ready to track · ${items.length - readyCount} to review`}
          </Text>
        </View>
        <Text className="text-[26px] leading-[32px] font-extrabold text-content">
          {formatAmount(total, preferred.symbol)}
        </Text>
      </View>

      {/* Rows already ticked on arrival don't animate. Only a tap does. */}
      <LayoutAnimationConfig skipEntering>
        <View className="mt-3 gap-2">
          {items.map((item) => (
            <DetectedSubRow
              key={item.id}
              item={item}
              currencySymbol={preferred.symbol}
              onToggle={() => toggle(item)}
              onPressCycle={() => openCycle(item)}
            />
          ))}
        </View>
      </LayoutAnimationConfig>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={`${editing?.name ?? ""} billing`}
        subtitle="How often does this charge you?"
      >
        <SegmentedControl
          options={billingCycles}
          value={draftCycle}
          onChange={changeCycle}
          className="mt-4"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Next renewal ${formatShortDate(draftRenewal || projected)}. Change date`}
          accessibilityState={{ expanded: pickingDate }}
          onPress={() => setPickingDate(!pickingDate)}
          className="mt-4 flex-row items-center gap-3 rounded-xl bg-card p-3.5 active:opacity-90"
        >
          <AccentTint className="size-11 rounded-md">
            <Icon icon={Calendar03Icon} size={22} className="text-accent-text" />
          </AccentTint>
          <View className="flex-1">
            <Text className="text-[16px] leading-[24px] font-semibold text-content">
              Next renewal
            </Text>
            <Text className="text-[13px] leading-[19px] font-normal text-muted">
              {editing
                ? `${formatShortDate(draftRenewal || projected)} · based on your last charge on ${formatShortDate(editing.lastCharge)}`
                : ""}
            </Text>
          </View>
          <Icon
            icon={pickingDate ? ArrowDown01Icon : ArrowRight01Icon}
            size={20}
            className="text-muted"
          />
        </Pressable>
        {pickingDate && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3 grow-0"
            contentContainerClassName="gap-2"
          >
            {renewalOptions.map((date) => {
              const selected = formatShortDate(date) === formatShortDate(draftRenewal);
              return (
                <Pressable
                  key={date}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setDraftRenewal(date);
                  }}
                  className={cn(
                    "min-h-11 justify-center rounded-full px-4",
                    selected ? "bg-accent" : "bg-card",
                  )}
                >
                  <Text
                    className={cn(
                      "text-[14px] leading-[20px] font-semibold",
                      selected ? "text-on-accent" : "text-content",
                    )}
                  >
                    {formatShortDate(date)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
        <InlineNote
          icon={InformationCircleIcon}
          text="We will keep tracking this renewal until you cancel it. No need to upload again."
          className="mt-4"
        />
        <Button label="Save" onPress={saveCycle} className="mt-4" />
      </BottomSheet>
    </FlowScreen>
  );
}
