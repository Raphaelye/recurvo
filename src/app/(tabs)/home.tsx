import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-main">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 120 }}>
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="text-[22px] leading-[28px] font-bold text-content">Home</Text>
          <View className="rounded-full bg-card px-3 py-2">
            <Text className="text-[12px] leading-[16px] font-semibold text-muted">This month</Text>
          </View>
        </View>

        <View className="rounded-2xl bg-card p-5">
          <Text className="text-[13px] leading-[19px] font-medium text-muted">Monthly spend</Text>
          <Text className="mt-3 text-[34px] leading-[40px] font-extrabold text-content">$132.40</Text>
          <Text className="mt-2 text-[13px] leading-[19px] text-soft">4 subscriptions active</Text>
        </View>

        <View className="mt-6 gap-4">
          <View className="rounded-2xl bg-card p-4">
            <Text className="text-[15px] leading-[22px] font-semibold text-content">Upcoming renewals</Text>
            <Text className="mt-3 text-[13px] leading-[19px] text-soft">Spotify • $11.99 • 2 days</Text>
            <Text className="mt-2 text-[13px] leading-[19px] text-soft">Netflix • $15.99 • 5 days</Text>
          </View>

          <View className="rounded-2xl bg-card p-4">
            <Text className="text-[15px] leading-[22px] font-semibold text-content">Quick actions</Text>
            <View className="mt-3 flex-row gap-3">
              <View className="flex-1 rounded-xl bg-foreground p-3">
                <Text className="text-[13px] leading-[19px] font-medium text-muted">New card</Text>
                <Text className="mt-1 text-[16px] leading-[24px] font-semibold text-content">Add</Text>
              </View>
              <View className="flex-1 rounded-xl bg-foreground p-3">
                <Text className="text-[13px] leading-[19px] font-medium text-muted">Review</Text>
                <Text className="mt-1 text-[16px] leading-[24px] font-semibold text-content">Insights</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
