import React from "react";
import { Platform, StyleSheet, ViewStyle, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface BlurBackgroundProps {
  style?: ViewStyle;
  intensity?: number;
  colors?: [string, string];
  children?: React.ReactNode;
  blurType?: "light" | "dark";
  animated?: boolean;
}

export default function BlurBackground({
  style,
  intensity = 20,
  colors = ["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"],
  children,
  blurType = "light",
  animated = true,
}: BlurBackgroundProps) {
  // Gradient colors based on blur type
  const gradientColors =
    blurType === "dark" ? ["rgba(0, 0, 0, 0.3)", "rgba(0, 0, 0, 0.1)"] : colors;

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={gradientColors as [string, string]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    // Enhanced backdrop effect for Android
    ...(Platform.OS === "android" && {
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
