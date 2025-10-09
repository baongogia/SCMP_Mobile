import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/src/constants/colors";

interface BadgeProps {
  count: number;
  size?: "small" | "medium" | "large";
  color?: string;
  textColor?: string;
  maxCount?: number;
}

export const Badge: React.FC<BadgeProps> = ({
  count,
  size = "small",
  color = colors.error,
  textColor = colors.white,
  maxCount = 99,
}) => {
  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          container: styles.smallContainer,
          text: styles.smallText,
        };
      case "medium":
        return {
          container: styles.mediumContainer,
          text: styles.mediumText,
        };
      case "large":
        return {
          container: styles.largeContainer,
          text: styles.largeText,
        };
      default:
        return {
          container: styles.smallContainer,
          text: styles.smallText,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[sizeStyles.container, { backgroundColor: color }]}>
      <Text style={[sizeStyles.text, { color: textColor }]}>
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  smallContainer: {
    position: "absolute",
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    zIndex: 1,
    borderWidth: 2,
    borderColor: colors.white,
  },
  mediumContainer: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  largeContainer: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  smallText: {
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
  },
  mediumText: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  largeText: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
});
