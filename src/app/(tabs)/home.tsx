import { useUser } from "@clerk/expo";
import { Notification01Icon, PlusSignIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddSubscriptionsSheet } from "@/components/AddSubscriptionsSheet";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { Illustration } from "@/components/Illustration";
import { SubscriptionRow } from "@/components/SubscriptionRow";
import { TotalSpendCard } from "@/components/TotalSpendCard";
import { UpcomingCard } from "@/components/UpcomingCard";
import { useHomeSummary } from "@/hooks/useHomeSummary";
import { useReminders } from "@/hooks/useReminders";
import { cn } from "@/lib/cn";
import { withSymbol } from "@/lib/currency";
import { usePreferencesStore } from "@/store/preferencesStore";

// px-screen-lg and the gap between the upcoming cards, for the card width.
const SCREEN_PADDING = 24;
const CARD_GAP = 12;

const openDetails = (id: string) =>
  router.push({ pathname: "/subscription/[id]", params: { id } });

export default function HomeScreen() {
  const { user } = useUser();
  const preferred = usePreferencesStore((state) => state.currency);
  const { count, total, upcoming, latest } = useHomeSummary();
  const reminders = useReminders();
  const { width } = useWindowDimensions();
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const hasSubscriptions = count > 0;
  // Two cards and the gap fill the width inside the screen padding, as in Figma.
  const cardWidth = (width - SCREEN_PADDING * 2 - CARD_GAP) / 2;

  // Accounts created before sign-up asked for a name fall back to their email.
  const emailName = user?.primaryEmailAddress?.emailAddress.split("@")[0] ?? "";
  const firstName = user?.firstName ?? emailName;
  // The full name gives the avatar two initials.
  const fullName = user?.fullName ?? emailName;

  return (
    <View className="flex-1 bg-main">
      {/* Bottom edge left out so the content scrolls under the floating tab bar. */}
      <SafeAreaView edges={["top"]} style={styles.container}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-screen-lg pb-28 pt-2"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center gap-3">
            <View className="flex-1 flex-row items-center gap-2">
              <Avatar name={fullName} imageUrl={user?.hasImage ? user.imageUrl : undefined} />
              <View className="flex-1">
                <Text className="text-[13px] leading-[18px] font-normal text-muted">
                  Welcome back
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-[25px] leading-[32px] font-semibold text-content"
                >
                  {firstName}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  reminders.length > 0
                    ? `Notifications, ${reminders.length} renewing soon`
                    : "Notifications"
                }
                hitSlop={1}
                onPress={() => router.push("/notifications")}
                className="size-[42px] items-center justify-center rounded-full border border-line bg-foreground active:opacity-90"
              >
                <Icon icon={Notification01Icon} size={20} className="text-content" />
                {/* A badge over the bell's shoulder while a renewal is due within 3 days. */}
                {reminders.length > 0 && (
                  <View className="absolute right-2 top-2 size-3 rounded-full border-2 border-foreground bg-accent" />
                )}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add subscriptions"
                hitSlop={2}
                onPress={() => setAddSheetOpen(true)}
                className="size-10 items-center justify-center rounded-full bg-accent active:opacity-90"
              >
                <Icon icon={PlusSignIcon} size={20} className="text-on-accent" />
              </Pressable>
            </View>
          </View>

          <View className="mt-9">
            <TotalSpendCard
              total={hasSubscriptions ? total : withSymbol("0.00", preferred.symbol)}
              count={count}
            />
          </View>

          {/* Renewals due this week. Hidden when nothing is due. */}
          {upcoming.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={cardWidth + CARD_GAP}
              decelerationRate="fast"
              // Scrolls edge to edge, while the first card lines up with the screen padding.
              className="-mx-screen-lg mt-10"
              contentContainerClassName="gap-3 px-screen-lg"
            >
              {upcoming.map((subscription) => (
                <UpcomingCard
                  key={subscription.id}
                  subscription={subscription}
                  width={cardWidth}
                  onPress={() => openDetails(subscription.id)}
                />
              ))}
            </ScrollView>
          )}

          <View
            className={cn(
              "flex-row items-center justify-between",
              upcoming.length > 0 ? "mt-9" : "mt-14",
            )}
          >
            <Text className="text-[18px] leading-[24px] font-medium text-content">
              Active Subscriptions
            </Text>
            <Pressable
              accessibilityRole="button"
              hitSlop={9}
              onPress={() => router.navigate("/subscriptions")}
              className="rounded-full border border-line bg-foreground px-3.5 py-1 active:opacity-90"
            >
              <Text className="text-[12px] leading-[16px] font-medium text-content">View All</Text>
            </Pressable>
          </View>

          {hasSubscriptions ? (
            <View className="mt-7.5 gap-2">
              {latest.map((subscription) => (
                <SubscriptionRow
                  key={subscription.id}
                  subscription={subscription}
                  onPress={() => openDetails(subscription.id)}
                />
              ))}
            </View>
          ) : (
            <View className="px-2.5">
              <View className="mt-8.5 items-center">
                <Illustration name="noSub" width={154} height={123} />
              </View>

              <View className="mt-4.5 flex-row items-center gap-3">
                <View className="icon-circle size-11">
                  <Icon icon={Search01Icon} size={20} className="text-content" />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] leading-[20px] font-semibold text-content">
                    Add your subscriptions in seconds
                  </Text>
                  <Text className="mt-1 text-[12px] leading-[17px] font-normal text-soft">
                    Upload a bank statement and we will spot your recurring charges.
                  </Text>
                </View>
              </View>

              <Button
                label="Find my subscriptions"
                onPress={() => router.push("/setup/upload")}
                className="mt-3.5"
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <AddSubscriptionsSheet
        visible={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        onFind={() => router.push("/setup/upload")}
        onAddManually={() => router.push("/add-subscription")}
      />
    </View>
  );
}

// SafeAreaView can't take className (AGENTS.md), so it is styled here.
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
