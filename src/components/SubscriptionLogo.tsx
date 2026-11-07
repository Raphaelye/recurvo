import { Text, View } from "react-native";

import { ServiceLogo } from "@/components/ServiceLogo";
import { cn } from "@/lib/cn";
import { logosEnabled } from "@/lib/logoDev";

// md: the 40px tile on subscription cards and rows. lg: the 52px tile in the details modal.
const sizes = {
  md: {
    tile: "size-10 rounded-sm",
    logo: "size-[30px] rounded-[5px]",
    letter: "text-[16px] leading-[24px]",
  },
  lg: {
    tile: "size-[52px] rounded-[12px]",
    logo: "size-[39px] rounded-[6px]",
    letter: "text-[20px] leading-[28px]",
  },
};

type SubscriptionLogoProps = {
  name: string;
  size?: keyof typeof sizes;
};

// A service's logo centred in a rounded tile.
// Shows the first letter instead when there is no Logo.dev key.
export function SubscriptionLogo({ name, size = "md" }: SubscriptionLogoProps) {
  const classes = sizes[size];

  return (
    <View className={cn("items-center justify-center bg-foreground", classes.tile)}>
      {logosEnabled ? (
        <ServiceLogo name={name} className={classes.logo} />
      ) : (
        <Text className={cn("font-semibold text-content", classes.letter)}>
          {name.trim()[0]?.toUpperCase()}
        </Text>
      )}
    </View>
  );
}
