import { View } from "react-native";

import { cn } from "@/lib/cn";
import type { ThemePreference } from "@/types/theme";

// A 72 x 96 drawing of an app screen in the light or dark palette, whatever theme
// is on. System shows the light half on the left and the dark half on the right.
// The palette-* classes (theme/colors.css) pin the colours of everything inside them.
export function ThemePreview({ preference }: { preference: ThemePreference }) {
  return (
    <View className="h-24 w-[72px] flex-row overflow-hidden rounded-sm border border-line">
      {preference === "system" ? (
        <>
          <View className="flex-1 items-start overflow-hidden">
            <View className="palette-light flex-1">
              <MiniScreen />
            </View>
          </View>
          <View className="flex-1 items-end overflow-hidden">
            <View className="palette-dark flex-1">
              <MiniScreen />
            </View>
          </View>
        </>
      ) : (
        <View className={cn(preference === "light" ? "palette-light" : "palette-dark", "flex-1")}>
          <MiniScreen />
        </View>
      )}
    </View>
  );
}

// A header bar over two cards. Fills the 70px inside the 1px border.
function MiniScreen() {
  return (
    <View className="w-[70px] flex-1 bg-main px-[7px] pt-[9px]">
      <View className="h-[5px] w-[30px] rounded-full bg-content" />
      <View className="mt-[9px] rounded-[5px] bg-card px-1.5 pt-2">
        <View className="h-1 w-6 rounded-full bg-muted" />
        <View className="mt-1.5 h-1.5 w-[30px] rounded-full bg-accent" />
      </View>
      <View className="mt-2 rounded-[5px] bg-card px-1.5 pb-1 pt-2">
        <View className="h-1 w-9 rounded-full bg-muted" />
        <View className="mt-1 h-1 w-[18px] rounded-full bg-content" />
      </View>
    </View>
  );
}
