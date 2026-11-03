import { View } from "react-native";

// Visual only. The row around it handles the press and the radio role.
export function Radio({ selected }: { selected: boolean }) {
  return selected ? (
    <View className="radio-selected">
      <View className="radio-dot" />
    </View>
  ) : (
    <View className="radio" />
  );
}
