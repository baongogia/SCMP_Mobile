// Color palette for swimming course management app
export const colors = {
  // Primary colors
  primary: "#003E9F",
  primaryDark: "#005C8A",
  primaryLight: "#2095c7",
  titleColor: "#000000",
  mainBackground: "#f5f5f5",
  transparent: "rgba(0, 0, 0, 0)",

  // Secondary colors - Aqua theme
  secondary: "#00CED1",
  secondaryDark: "#20B2AA",
  secondaryLight: "#AFEEEE",

  // Accent colors - Coral theme
  accent: "#FF7F50",
  accentDark: "#FF6347",
  accentLight: "#FFB07A",

  // Neutral colors
  white: "#FFFFFF",
  black: "#000000",
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },

  // Status colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  // Checkmark colors
  checkmarkDone: "#0f8c1a",
  checkmarkNotDone: "#c20c0c",
  checkmarkOngoing: "#f7ac07",
  checkmarkNotStarted: "#cbd2d6",

  // Additional colors for children features
  shadow: "#000000",
  grayc: "#9CA3AF",
  lightGray: "#E5E7EB",
  dark: "#111827",
  lightPrimary: "#E0F2FE",

  // Background colors
  background: "#FFFFFF",
  backgroundSecondary: "#F9FAFB",
  backgroundTertiary: "#F3F4F6",

  // Text colors
  text: "#111827",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  textInverse: "#FFFFFF",

  // Border colors
  border: "#E5E7EB",
  borderLight: "#F3F4F6",
  borderDark: "#D1D5DB",

  // Overlay colors
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayLight: "rgba(0, 0, 0, 0.3)",
  overlayDark: "rgba(0, 0, 0, 0.7)",
};

// Dark theme colors
export const darkColors = {
  ...colors,
  background: "#111827",
  backgroundSecondary: "#1F2937",
  backgroundTertiary: "#374151",
  text: "#FFFFFF",
  textSecondary: "#D1D5DB",
  textTertiary: "#9CA3AF",
  border: "#374151",
  borderLight: "#4B5563",
  borderDark: "#1F2937",
};

// Colors object for theme switching (matches old structure)
export const Colors = {
  light: {
    text: colors.text,
    background: colors.background,
    tint: colors.primary,
    tabIconDefault: colors.gray[400],
    tabIconSelected: colors.primary,
  },
  dark: {
    text: darkColors.text,
    background: darkColors.background,
    tint: colors.primary,
    tabIconDefault: colors.gray[400],
    tabIconSelected: colors.primary,
  },
};
