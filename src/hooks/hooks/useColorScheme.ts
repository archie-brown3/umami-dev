import { useColorScheme as _useColorScheme } from "react-native";

/**
 * A hook that gets the current color scheme preference from the device
 * Returns 'light' or 'dark'
 */
export function useColorScheme(): "light" | "dark" {
  const colorScheme = _useColorScheme();

  // If the device theme doesn't provide a value, default to light
  return colorScheme === "dark" ? "dark" : "light";
}

// Also export as default for Expo Router compatibility
export default useColorScheme;
