import { StyleSheet, Platform, Dimensions, StatusBar } from "react-native";

// App colors
export const colors = {
  primary: "#8AB39F", // Recipe green
  primaryLight: "#A8C5B7",
  primaryDark: "#5D9A79",
  secondary: "#F59E0B", // Amber
  secondaryLight: "#FBBF24",
  secondaryDark: "#D97706",
  success: "#10B981", // Emerald
  danger: "#EF4444", // Red
  warning: "#F59E0B", // Amber
  info: "#3B82F6", // Blue
  light: "#F3F4F6", // Gray-100
  dark: "#1F2937", // Gray-800
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
};

// Font sizes
export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
};

// Screen dimensions
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

// Device utils
export const isIOS = Platform.OS === "ios";
export const isAndroid = Platform.OS === "android";
export const statusBarHeight = StatusBar.currentHeight || 0;

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
};

// Border radius
export const borderRadius = {
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  "2xl": 16,
  full: 9999,
};

// Shadow styles for different platforms
export const createShadow = (
  elevation = 2,
  opacity = 0.2,
  radius = 3,
  offsetWidth = 0,
  offsetHeight = 2,
  color = "#000"
) => {
  if (Platform.OS === "ios") {
    return {
      shadowColor: color,
      shadowOffset: {
        width: offsetWidth,
        height: offsetHeight,
      },
      shadowOpacity: opacity,
      shadowRadius: radius,
    };
  } else {
    return {
      elevation,
    };
  }
};

// Combine all these into theme
export const theme = {
  colors,
  fontSizes,
  spacing,
  borderRadius,
  createShadow,
};

// Common styles that can be reused across components
export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...createShadow(3, 0.1, 8, 0, 4),
  },
  safeArea: {
    flex: 1,
    paddingTop: isAndroid ? statusBarHeight : 0,
  },
  textInput: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.md,
    color: colors.dark,
  },
  button: {
    height: 50,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.dark,
  },
  // Add more common styles as needed
});
