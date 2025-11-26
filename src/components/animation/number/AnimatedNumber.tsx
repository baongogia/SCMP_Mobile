import React, { useEffect, useState } from "react";
import { TextProps, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";
import { useThemeColor } from "@/src/hooks/useThemeColor";

const AnimatedText = Animated.createAnimatedComponent(Animated.Text);

interface AnimatedNumberProps extends Omit<TextProps, "children"> {
  value: number;
  duration?: number;
  delay?: number;
  formatter?: (value: number) => string;
  style?: TextProps["style"];
  lightColor?: string;
  darkColor?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 800,
  delay = 0,
  formatter,
  style,
  lightColor,
  darkColor,
  ...textProps
}) => {
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  useEffect(() => {
    animatedValue.value = withDelay(
      delay,
      withTiming(value, {
        duration,
      })
    );
  }, [value, duration, delay]);

  useAnimatedReaction(
    () => animatedValue.value,
    (currentValue) => {
      const rounded = Math.round(currentValue);
      runOnJS(setDisplayValue)(rounded);
    },
    [animatedValue]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      animatedValue.value,
      [0, value || 1],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity: interpolate(
        progress,
        [0, 0.5, 1],
        [0.5, 1, 1],
        Extrapolation.CLAMP
      ),
    };
  });

  const formattedValue = formatter
    ? formatter(displayValue)
    : displayValue.toString();

  return (
    <AnimatedText
      style={[{ color }, styles.text, style, animatedStyle]}
      {...textProps}
    >
      {formattedValue}
    </AnimatedText>
  );
};

const styles = StyleSheet.create({
  text: {},
});
