/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { colors } from "@/src/constants";
import { useColorScheme } from "@/src/hooks/useColorScheme";

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof colors
): string {
  const theme = useColorScheme() ?? "light";
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    const colorValue = colors[colorName];
    // Handle nested color objects (like colors.gray)
    if (typeof colorValue === "object" && colorValue !== null) {
      // Return a default color for nested objects
      return colors.primary;
    }
    return colorValue as string;
  }
}
