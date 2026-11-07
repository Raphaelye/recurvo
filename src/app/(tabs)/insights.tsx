import { ChartIcon, TradeDownIcon, TradeUpIcon } from "@hugeicons/core-free-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Illustration } from "@/components/Illustration";
import { InsightStatCard } from "@/components/InsightStatCard";
import { SavedBanner } from "@/components/SavedBanner";
import { SmartReviewCard } from "@/components/SmartReviewCard";
import { SpendByCategory } from "@/components/SpendByCategory";
import { StopTrackingSheet } from "@/components/StopTrackingSheet";
import { useInsights } from "@/hooks/useInsights";
import { useSmartReviews } from "@/hooks/useSmartReviews";
import { cn } from "@/lib/cn";
import { withSymbol } from "@/lib/currency";
import { track } from "@/lib/posthog";
import { usePreferencesStore } from "@/store/preferencesStore";
import { useReviewStore } from "@/store/reviewStore";
import type { SmartReview } from "@/types/insights";

const openDetails = (id: string) =>
  router.push({ pathname: "/subscription/[id]", params: { id } });

export default function InsightsScreen() {
  const insights = useInsights();
  const reviews = useSmartReviews();
  const keep = useReviewStore((state) => state.keep);
  const preferred = usePreferencesStore((state) => state.currency);
  const [openId, setOpenId] = useState<string>();
  // Kept after the sheet closes, so its text does not change while it slides out.
  const [stopId, setStopId] = useState<string>();
  const [stopOpen, setStopOpen] = useState(false);

  // The first review is open until another is tapped, or after the open one is kept.
  const openReview = reviews.find((review) => review.id === openId) ?? reviews[0];
  // Nothing tracked shows the empty state, under zeroed figures.
  const empty = !insights.hasTracked;
  const zero = withSymbol("0.00", preferred.symbol);

  const keepReview = (review: SmartReview) => {
    keep(review.id);
    track("review_kept", { kind: review.kind });
  };

  const askStop = (review: SmartReview) => {
    setStopId(review.subscriptionId);
    setStopOpen(true);
  };

  return (
    <View className="flex-1 bg-main">
      {/* Bottom edge left out so the content scrolls under the floating tab bar. */}
      <SafeAreaView edges={["top"]} style={styles.container}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-screen pb-28 pt-2"
          showsVerticalScrollIndicator={false}
        >
          <Text
            accessibilityRole="header"
            className="text-[28px] leading-[36px] font-medium text-content"
          >
            Insights
          </Text>

          {/* 16 from the screen edges, 4 wider than the text, as in Figma. */}
          <View className="-mx-1 mt-8 flex-row gap-5">
            <InsightStatCard
              label="Monthly"
              icon={insights.trend === "down" ? TradeDownIcon : TradeUpIcon}
              amount={empty ? zero : insights.monthly}
              caption={empty ? `${zero} from last month` : insights.changeLabel}
            />
            <InsightStatCard
              label="Yearly"
              icon={ChartIcon}
              amount={empty ? zero : insights.yearly}
              caption="Projected annual spend"
            />
          </View>

          {empty ? (
            <EmptyState />
          ) : (
            <>
              {reviews.length > 0 && (
                <View className="mt-5">
                  <Text className="text-[18px] leading-[24px] font-medium text-content">
                    Smart Reviews
                  </Text>
                  <View className="mt-3 gap-3">
                    {reviews.map((review) => (
                      <SmartReviewCard
                        key={review.id}
                        review={review}
                        open={review.id === openReview?.id}
                        onOpen={() => setOpenId(review.id)}
                        onKeep={() => keepReview(review)}
                        onCancel={() => askStop(review)}
                      />
                    ))}
                  </View>
                </View>
              )}

              <SavedBanner
                amount={insights.saved}
                onPress={() =>
                  router.navigate({ pathname: "/subscriptions", params: { tab: "Cancelled" } })
                }
                className={cn("-mx-1", reviews.length > 0 ? "mt-11" : "mt-5")}
              />

              {insights.bubbles.length > 0 && (
                <SpendByCategory
                  categories={insights.categories}
                  bubbles={insights.bubbles}
                  onOpen={openDetails}
                  className="mt-13"
                />
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <StopTrackingSheet
        subscriptionId={stopId}
        visible={stopOpen}
        source="insights"
        onClose={() => setStopOpen(false)}
        onStopped={(id) => router.push({ pathname: "/removed/[id]", params: { id } })}
      />
    </View>
  );
}

// Nothing tracked yet: the way in to adding subscriptions.
function EmptyState() {
  return (
    // The button sits 42 from the screen edges, as in Figma.
    <View className="mt-22 px-5.5">
      <View className="items-center">
        <Illustration name="noInsight" width={169} height={137} />
        <Text className="mt-1 text-center text-[20px] leading-[26px] font-medium text-content">
          Add Subscriptions to get Insights
        </Text>
        <Text className="mt-2 text-center text-[11px] leading-[14px] font-medium text-soft">
          {"You do not have any subscriptions yet.\nCreate one to get insights on your spending."}
        </Text>
      </View>

      <Button
        label="Find my subscriptions"
        onPress={() => router.push("/setup/upload")}
        className="mt-7.5"
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
  );
}

// SafeAreaView can't take className (AGENTS.md), so it is styled here.
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
