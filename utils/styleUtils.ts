import { StyleSheet, Platform, Dimensions, StatusBar } from "react-native";
// import { colors, spacing, typography } from "../../utils/styleUtils";

// App colors
export const colors = {
  primary: "#FF5A5F",
  secondary: "#00A699",
  black: "#000000",
  white: "#FFFFFF",
  dark: "#1F2937",
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
  red: {
    500: "#EF4444",
    600: "#DC2626",
  },
  green: {
    500: "#10B981",
    600: "#059669",
  },
  blue: {
    50: "#EFF6FF",
    500: "#3B82F6",
    600: "#2563EB",
  },
  orange: {
    500: "#F97316",
    600: "#EA580C",
  },
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
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
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

// Typography
export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeights: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};

// Shadow styles for different platforms
export const createShadow = (
  elevation = 2,
  opacity = 0.2,
  radius = 3,
  offsetWidth = 0,
  offsetHeight = 2
) => {
  return Platform.select({
    ios: {
      shadowColor: colors.black,
      shadowOffset: {
        width: offsetWidth,
        height: offsetHeight,
      },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: {
      elevation,
    },
  });
};

// Combine all these into theme
export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
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
    ...createShadow(3, 0.1, 8),
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
    fontSize: typography.fontSizes.md,
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
    fontSize: typography.fontSizes.md,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700",
    color: colors.dark,
  },
});

export const fontSizes = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
};
