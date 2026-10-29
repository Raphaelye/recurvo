import { useAuth } from "@clerk/expo";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeColor } from "@/hooks/useThemeColor";

export default function Index() {
  // const { scheme, preference, setPreference } = useTheme();
  const backgroundColor = useThemeColor("main");
  const { signOut } = useAuth();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View className="flex bg-main">
        <Text className="text-[26px] leading-[32px] font-bold text-content">Home</Text>
        {/* Temporary, until Settings has the sign-out row. */}
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => signOut()}>
          <Text className="link mt-4 text-center">Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
