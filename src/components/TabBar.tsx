import type { IconSvgElement } from "@hugeicons/react-native";
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import type { BottomTabBarProps } from "expo-router/tabs";
import { styled } from "nativewind";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/Icon";
import { useTheme } from "@/hooks/useTheme";

// Liquid Glass needs iOS 26. Android and older iPhones get the solid tab-bar colour.
const glassAvailable = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

const StyledGlassView = styled(GlassView);

type TabBarProps = BottomTabBarProps & {
  // Route name to icon. Routes without an icon get no tab.
  icons: Record<string, IconSvgElement>;
};

export function TabBar({ state, descriptors, emitter, navigateToTab, icons }: TabBarProps) {
  const { scheme } = useTheme();
  // Glass follows the theme, so inactive icons use the text colour (black on light glass).
  // The solid bar is the same grey in both themes, so its inactive icons stay white.
  const inactiveIcon = glassAvailable ? "text-content" : "text-on-accent";

  const tabs = state.routes.map((route, index) => {
    const icon = icons[route.name];
    if (!icon) {
      return null;
    }

    const focused = state.index === index;
    const { options } = descriptors[route.key];

    const onPress = () => {
      const event = emitter.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigateToTab(route.key);
      }
    };

    return (
      <Pressable
        key={route.key}
        className="tab-item"
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title}
        onPress={onPress}
      >
        <Icon icon={icon} size={24} className={focused ? "text-accent" : inactiveIcon} />
      </Pressable>
    );
  });

  // The theme is passed explicitly so the glass follows the in-app setting, not only the system.
  if (glassAvailable) {
    return (
      <StyledGlassView glassEffectStyle="regular" colorScheme={scheme} className="tab-bar-glass">
        {tabs}
      </StyledGlassView>
    );
  }

  return <View className="tab-bar">{tabs}</View>;
}
