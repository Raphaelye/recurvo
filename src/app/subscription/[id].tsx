import { Calendar04Icon, Delete02Icon, Edit03Icon } from "@hugeicons/core-free-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { ConfirmSheet } from "@/components/ConfirmSheet";
import { Icon } from "@/components/Icon";
import { ModalBackdrop } from "@/components/ModalBackdrop";
import { PaymentMethodPicker } from "@/components/PaymentMethodPicker";
import { StopTrackingSheet } from "@/components/StopTrackingSheet";
import { SubscriptionLogo } from "@/components/SubscriptionLogo";
import { useSubscriptionItems } from "@/hooks/useSubscriptionItems";
import { track } from "@/lib/posthog";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import type { SubscriptionListItem } from "@/types/subscription";

// One subscription's details, a card over the blurred screen. Opened from the
// rows and upcoming cards on Home and Subscriptions. A cancelled subscription
// offers "Continue Tracking" in place of "Cancel Subscription", which opens the
// Stop tracking sheet and then the removed screen.
export default function SubscriptionDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const saved = useSubscriptionItems().find((item) => item.id === id);
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const update = useSubscriptionStore((state) => state.update);
  const remove = useSubscriptionStore((state) => state.remove);
  // What the card showed when the modal started closing, so a cancel or delete
  // doesn't change it while it fades out.
  const [closing, setClosing] = useState<SubscriptionListItem>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);

  const subscription = closing ?? saved;

  // Only an old link to a deleted subscription gets here. Tapping anywhere closes it.
  if (!subscription) {
    return <ModalBackdrop onPress={() => router.back()} />;
  }

  const { name, amount, cycle, category, renewsOn, cancelledOn, card } = subscription;
  const cancelled = cancelledOn !== undefined;

  const close = () => {
    setClosing(subscription);
    router.back();
  };

  const edit = () => {
    router.replace({ pathname: "/add-subscription", params: { id: subscription.id } });
  };

  const askDelete = () => {
    setDeleteConfirmed(false);
    setDeleteOpen(true);
  };

  const finishDelete = () => {
    close();
    remove(subscription.id);
    track("subscription_deleted", { cycle });
  };

  const confirmDelete = () => {
    setDeleteOpen(false);
    // On iOS this screen can't close while the sheet is still on top of it, so
    // the delete waits for the sheet's onDismiss. Android has no onDismiss.
    if (Platform.OS === "ios") {
      setDeleteConfirmed(true);
    } else {
      finishDelete();
    }
  };

  // The removed screen takes this modal's place, so going back returns to the tab.
  const showRemoved = (id: string) => {
    setClosing(subscription);
    router.replace({ pathname: "/removed/[id]", params: { id } });
  };

  const continueTracking = () => {
    close();
    update(subscription.id, { cancelledAt: undefined, cancelReminder: undefined });
    track("subscription_restored", { cycle });
  };

  return (
    <View className="flex-1 justify-center px-[43px]">
      <ModalBackdrop onPress={close} />

      <View className="rounded-sheet bg-card px-7 pb-5 pt-4.5">
        {/* 20 from the card edge, 8 closer than the content. */}
        <View className="-mr-2 flex-row justify-end gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${name}`}
            hitSlop={4}
            onPress={edit}
            className="size-9 items-center justify-center rounded-full border border-line bg-foreground active:opacity-90"
          >
            <Icon icon={Edit03Icon} size={16} className="text-content" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete ${name}`}
            hitSlop={4}
            onPress={askDelete}
            className="size-9 items-center justify-center rounded-full border border-line bg-foreground active:opacity-90"
          >
            <Icon icon={Delete02Icon} size={16} className="text-destructive" />
          </Pressable>
        </View>

        <View className="mt-6.5 flex-row items-center gap-3 self-center">
          <SubscriptionLogo name={name} size="lg" />
          <View className="shrink">
            <Text
              numberOfLines={1}
              className="text-[24px] leading-[30px] font-semibold text-content"
            >
              {name}
            </Text>
            <Text className="text-[15px] leading-[20px] font-medium text-muted">
              {`${amount} / ${cycle}`}
            </Text>
          </View>
        </View>

        <View className="mt-6.5 flex-row items-center gap-1">
          <Icon icon={Calendar04Icon} size={38} className="text-content" />
          <View>
            <Text className="text-[13px] leading-[18px] font-normal text-muted">
              {cancelled ? "Cancelled on" : "Renews"}
            </Text>
            <Text className="text-[15px] leading-[20px] font-semibold text-accent-text">
              {cancelledOn ?? renewsOn}
            </Text>
          </View>
        </View>

        <View className="mt-4.5">
          <View className="min-h-[26px] flex-row items-center justify-between gap-3">
            <Text className="text-[13px] leading-[19px] font-normal text-muted">Category</Text>
            <Text
              numberOfLines={1}
              className="shrink text-[13px] leading-[19px] font-semibold text-content"
            >
              {category}
            </Text>
          </View>
          <View className="min-h-[26px] flex-row items-center justify-between gap-3">
            <Text className="text-[13px] leading-[19px] font-normal text-muted">
              Payment Method
            </Text>
            {/* The pill's chevron lines up with the values above. */}
            <PaymentMethodPicker
              variant="pill"
              card={card}
              savedCards={subscriptions.map((tracked) => tracked.card)}
              onChange={(next) => update(subscription.id, { card: next })}
              className="-mr-1.5 shrink"
            />
          </View>
        </View>

        <View className="mx-7.5 mt-8 gap-2.5">
          <Pressable
            accessibilityRole="button"
            onPress={cancelled ? continueTracking : () => setStopOpen(true)}
            className="min-h-9 items-center justify-center rounded-[8px] bg-accent px-4 py-2 active:opacity-90"
          >
            <Text className="text-[14px] leading-[20px] font-semibold text-on-accent">
              {cancelled ? "Continue Tracking" : "Cancel Subscription"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={close}
            className="min-h-9 items-center justify-center rounded-[8px] bg-foreground px-4 py-2 active:opacity-90"
          >
            <Text className="text-[14px] leading-[20px] font-semibold text-content">Close</Text>
          </Pressable>
        </View>
      </View>

      <ConfirmSheet
        visible={deleteOpen}
        title={`Delete ${name}?`}
        message={`This removes it from Recurvo for good. It doesn’t cancel your plan, so cancel it with ${name} too.`}
        confirmLabel="Delete Subscription"
        onConfirm={confirmDelete}
        onClose={() => setDeleteOpen(false)}
        onDismiss={() => {
          if (deleteConfirmed) {
            finishDelete();
          }
        }}
      />

      <StopTrackingSheet
        subscriptionId={subscription.id}
        visible={stopOpen}
        source="details"
        onClose={() => setStopOpen(false)}
        onStopped={showRemoved}
      />
    </View>
  );
}
