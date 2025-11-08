import React, { PropsWithChildren, useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing as ReanimatedEasing,
} from "react-native-reanimated";
import { useIsFocused } from "@react-navigation/native";

interface TabTransitionViewProps {
  style?: StyleProp<ViewStyle>;
  /**
   * Pixels to slide from on appear
   */
  slideFrom?: number;
  /**
   * Duration of the in animation
   */
  durationMs?: number;
}

const DEFAULT_DURATION = 220;

export const TabTransitionView: React.FC<
  PropsWithChildren<TabTransitionViewProps>
> = ({ children, style, slideFrom = 12, durationMs = DEFAULT_DURATION }) => {
  const isFocused = useIsFocused();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isFocused) {
      // animate in
      progress.value = withTiming(1, {
        duration: durationMs,
        easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
      });
    } else {
      // reset quickly so next focus animates from start
      progress.value = 0;
    }
  }, [isFocused, progress, durationMs]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
      transform: [
        {
          translateX: (1 - progress.value) * slideFrom,
        },
      ],
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
};

export default TabTransitionView;
