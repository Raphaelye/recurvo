import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Illustration } from "@/components/Illustration";
import { SegmentedControl } from "@/components/SegmentedControl";
import { SubscriptionRow } from "@/components/SubscriptionRow";
import { useSubscriptionItems } from "@/hooks/useSubscriptionItems";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { SubscriptionListItem } from "@/types/subscription";

const tabs = ["Monthly", "Yearly", "Cancelled"] as const;
type Tab = (typeof tabs)[number];

function isInTab(item: SubscriptionListItem, tab: Tab) {
  if (tab === "Cancelled") {
    return item.cancelledOn !== undefined;
  }
  // Weekly subscriptions sit under Monthly so none go missing.
  return item.cancelledOn === undefined && (item.cycle === "Yearly") === (tab === "Yearly");
}

export default function SubscriptionsScreen() {
  const items = useSubscriptionItems();
  // Insights' savings banner opens this tab on Cancelled.
  const { tab: openOn } = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>("Monthly");
  const [query, setQuery] = useState("");
  const placeholderColor = useThemeColor("neutral");

  // A new param picks its tab once.
  const [seenParam, setSeenParam] = useState<Tab>();
  if (openOn !== seenParam) {
    setSeenParam(openOn);
    if (openOn && tabs.includes(openOn)) {
      setTab(openOn);
    }
  }
  // Then it is cleared, so the banner works again after the user has switched tabs here.
  useEffect(() => {
    if (openOn) {
      router.setParams({ tab: undefined });
    }
  }, [openOn]);

  const inTab = items.filter((item) => isInTab(item, tab));

  const search = query.trim().toLowerCase();
  const results = inTab.filter(
    (item) =>
      item.name.toLowerCase().includes(search) || item.category.toLowerCase().includes(search),
  );

  return (
    <View className="flex-1 bg-main">
      {/* Bottom edge left out so the list scrolls under the floating tab bar. */}
      <SafeAreaView edges={["top"]} style={styles.container}>
        {/* Title, search and tabs stay put while the list scrolls. */}
        <View className="px-screen-lg pt-1">
          <Text className="text-[23px] leading-[30px] font-medium text-content">
            All Subscriptions
          </Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search Subscriptions..."
            placeholderTextColor={placeholderColor}
            accessibilityLabel="Search subscriptions"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            className="mt-5.5 rounded-[18px] border border-line bg-foreground px-7 py-4 text-[13px] leading-[18px] font-medium text-content"
          />
          <SegmentedControl options={tabs} value={tab} onChange={setTab} className="mt-[31px]" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-screen-lg pb-28"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {inTab.length === 0 ? (
            <EmptyState tab={tab} />
          ) : results.length === 0 ? (
            <Text className="mt-7.5 text-center text-[13px] leading-[19px] font-normal text-soft">
              {`No subscriptions match "${query.trim()}"`}
            </Text>
          ) : (
            <View className="mt-7.5 gap-2">
              {results.map((subscription) => (
                <SubscriptionRow
                  key={subscription.id}
                  subscription={subscription}
                  onPress={() =>
                    router.push({ pathname: "/subscription/[id]", params: { id: subscription.id } })
                  }
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const cancelled = tab === "Cancelled";

  return (
    <View className="mt-18">
      <View className="items-center">
        <Illustration name={cancelled ? "noCancelled" : "noSub"} width={180} height={144} />
        <Text className="mt-2.5 text-center text-[20px] leading-[26px] font-medium text-content">
          {cancelled ? "No Cancelled Subscriptions" : `No ${tab} Subscription!!`}
        </Text>
        <Text className="mt-2 text-center text-[11px] leading-[14px] font-medium text-soft">
          {cancelled
            ? "Cancel a subscription to stop tracking."
            : `You do not have any ${tab.toLowerCase()} subscription yet.\nCreate one to track it here`}
        </Text>
      </View>

      {/* Uploading or adding can't create a cancelled subscription, so Cancelled has no actions. */}
      {!cancelled && (
        <View className="px-4.5">
          <Button
            label="Find my subscriptions"
            onPress={() => router.push("/setup/upload")}
            className="mt-[51px]"
          />
          {/* py-1 and hitSlop give the 22px line a 46px touch area. */}
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.push("/add-subscription")}
            className="mt-2 self-center py-1 active:opacity-70"
          >
            <Text className="link">Add manually</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// SafeAreaView can't take className (AGENTS.md), so it is styled here.
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
