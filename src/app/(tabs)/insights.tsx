import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function InsightsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-main">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 120 }}>
        <Text className="text-[22px] leading-[28px] font-bold text-content">Insights</Text>

        <View className="mt-6 rounded-2xl bg-card p-5">
          <Text className="text-[13px] leading-[19px] font-medium text-muted">Spending profile</Text>
          <Text className="mt-3 text-[34px] leading-[40px] font-extrabold text-content">-12%</Text>
          <Text className="mt-2 text-[13px] leading-[19px] text-soft">Compared with last month</Text>
        </View>

        <View className="mt-6 gap-3">
          <View className="rounded-2xl bg-card p-4">
            <Text className="text-[15px] leading-[22px] font-semibold text-content">Smart review</Text>
            <Text className="mt-2 text-[13px] leading-[19px] text-soft">
              Your recurring spend is stable. The biggest change this month is streaming services.
            </Text>
          </View>

          <View className="rounded-2xl bg-card p-4">
            <Text className="text-[15px] leading-[22px] font-semibold text-content">Savings opportunity</Text>
            <Text className="mt-2 text-[13px] leading-[19px] text-soft">
              You could save roughly $18.99 by pausing one unused service.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
