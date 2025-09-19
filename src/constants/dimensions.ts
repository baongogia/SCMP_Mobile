import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const dimensions = {
  // Screen dimensions
  screenWidth: width,
  screenHeight: height,

  // Common spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Border radius
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  // Icon sizes
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 40,
  },

  // Button heights
  buttonHeight: {
    sm: 32,
    md: 44,
    lg: 52,
    xl: 60,
  },

  // Input heights
  inputHeight: {
    sm: 36,
    md: 44,
    lg: 52,
  },

  // Header heights
  headerHeight: 60,
  tabBarHeight: 60,

  // Card dimensions
  cardPadding: 16,
  cardMargin: 8,

  // List item heights
  listItemHeight: {
    sm: 44,
    md: 56,
    lg: 72,
  },

  // Modal dimensions
  modalMaxWidth: width * 0.9,
  modalMaxHeight: height * 0.8,

  // Avatar sizes
  avatarSize: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    xxl: 80,
  },

  // Breakpoints
  breakpoints: {
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
  },
};

// Responsive helpers
export const isSmallScreen = width < dimensions.breakpoints.sm;
export const isMediumScreen =
  width >= dimensions.breakpoints.sm && width < dimensions.breakpoints.md;
export const isLargeScreen = width >= dimensions.breakpoints.md;
