import {
  ChartColumnIcon,
  Home01Icon,
  Settings01Icon,
  Wallet03Icon,
} from "@hugeicons/core-free-icons";
import { Tabs } from "expo-router";

import { Icon } from "@/components/Icon";

const tabIcons = {
  home: Home01Icon,
  subscriptions: Wallet03Icon,
  insights: ChartColumnIcon,
  settings: Settings01Icon,
} as const;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 16,
          height: 72,
          paddingTop: 10,
          paddingBottom: 10,
          borderTopWidth: 0,
          borderRadius: 24,
          backgroundColor: "#5d5b5b",
          shadowOpacity: 0,
          elevation: 0,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 16,
        },
        tabBarIcon: ({ focused }) => {
          const IconGlyph = tabIcons[route.name as keyof typeof tabIcons];
          return (
            <Icon
              icon={IconGlyph}
              size={24}
              className={focused ? "text-on-accent" : "text-on-accent opacity-80"}
            />
          );
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="subscriptions" options={{ title: "Subscriptions" }} />
      <Tabs.Screen name="insights" options={{ title: "Insights" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
