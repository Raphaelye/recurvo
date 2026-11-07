import {
  ChartColumnIcon,
  Home01Icon,
  Settings01Icon,
  Wallet03Icon,
} from "@hugeicons/core-free-icons";
import { Tabs } from "expo-router";

import { TabBar } from "@/components/TabBar";
import { useNotificationOpen } from "@/hooks/useNotificationOpen";

const tabIcons = {
  home: Home01Icon,
  subscriptions: Wallet03Icon,
  insights: ChartColumnIcon,
  settings: Settings01Icon,
};

export default function TabsLayout() {
  // Tapped reminders and Smart Reviews open their screen from here, on top of Home.
  useNotificationOpen();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} icons={tabIcons} />}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="subscriptions" options={{ title: "Subscriptions" }} />
      <Tabs.Screen name="insights" options={{ title: "Insights" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
