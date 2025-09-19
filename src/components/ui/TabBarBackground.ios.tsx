import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { BlurView } from "@react-native-community/blur";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BlurTabBarBackground() {
  return (
    <BlurView
      style={StyleSheet.absoluteFill}
      blurType="light"
      blurAmount={10}
    />
  );
}

export function useBottomTabOverflow() {
  const tabHeight = useBottomTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  return tabHeight - bottom;
}
