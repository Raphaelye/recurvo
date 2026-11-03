import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const subscriptions = [
  { name: "Netflix", amount: "$15.99", cycle: "Monthly", status: "Paid" },
  { name: "Spotify", amount: "$11.99", cycle: "Monthly", status: "Next on 2d" },
  { name: "Notion", amount: "$8.00", cycle: "Monthly", status: "Upcoming" },
];

export default function SubscriptionsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-main">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 120 }}>
        <Text className="text-[22px] leading-[28px] font-bold text-content">Subscriptions</Text>

        <View className="mt-6 gap-3">
          {subscriptions.map((item) => (
            <View key={item.name} className="rounded-2xl bg-card p-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-[16px] leading-[24px] font-semibold text-content">{item.name}</Text>
                  <Text className="mt-1 text-[13px] leading-[19px] text-muted">{item.cycle}</Text>
                </View>
                <Text className="text-[16px] leading-[24px] font-semibold text-content">{item.amount}</Text>
              </View>
              <View className="mt-4 flex-row items-center justify-between">
                <Text className="text-[13px] leading-[19px] text-soft">{item.status}</Text>
                <View className="rounded-full bg-foreground px-2.5 py-1">
                  <Text className="text-[12px] leading-[16px] font-medium text-accent-text">Track</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
