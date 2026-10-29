import { HugeiconsIcon, type HugeiconsProps } from "@hugeicons/react-native";
import { useCssElement, type StyledProps } from "react-native-css";

const mapping = {
  className: {
    target: "style",
    nativeStyleMapping: { color: "color" },
  },
} as const;

type IconProps = StyledProps<HugeiconsProps, typeof mapping>;

// Colour an icon with a text colour class, e.g. <Icon icon={ViewIcon} className="text-neutral" />.
export function Icon(props: IconProps) {
  return useCssElement(HugeiconsIcon, props, mapping);
}
