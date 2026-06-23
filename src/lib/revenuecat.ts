import Purchases, {
  PurchasesOffering,
  LOG_LEVEL,
} from "react-native-purchases";
import { Platform } from "react-native";

// Product IDs
export const PRODUCT_IDS = {
  MONTHLY: "umami.premium.monthly",
  // ANNUAL: "umami.premium.annual",
} as const;

// Entitlement IDs
export const ENTITLEMENTS = {
  PREMIUM: "premium_access",
} as const;

/**
 * Initialize RevenueCat SDK
 * Call this once when your app starts, preferably in _layout.tsx
 */
export const initializeRevenueCat = async (userId?: string): Promise<void> => {
  try {
    // Enable debug logging for development
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
      console.log("[RevenueCat] Initializing in DEBUG mode");
    }

    const apiKey = Platform.select({
      ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
      android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
      default: "",
    });

    console.log("[RevenueCat] Using API key:", apiKey);

    if (!apiKey) {
      throw new Error("RevenueCat API key not found for platform");
    }

    // Configure RevenueCat with proper timeout
    await Purchases.configure({
      apiKey,
      appUserID: userId,
    });

    console.log("[RevenueCat] SDK initialized successfully");

    // Test offerings availability
    try {
      const offerings = await Purchases.getOfferings();
      console.log(
        "[RevenueCat] Available offerings:",
        offerings.current?.identifier
      );

      if (!offerings.current) {
        console.warn("[RevenueCat] No current offering found");
      }
    } catch (offeringsError) {
      console.error("[RevenueCat] Failed to fetch offerings:", offeringsError);
    }
  } catch (error) {
    console.error("[RevenueCat] Initialization error:", error);
    throw error;
  }
};

/**
 * Get available offerings from RevenueCat
 */
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error("[RevenueCat] Failed to get offerings:", error);
    return null;
  }
};

/**
 * Check if user has an active subscription
 */
export const checkSubscriptionStatus = async (): Promise<boolean> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return (
      typeof customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM] !==
      "undefined"
    );
  } catch (error) {
    console.error("[RevenueCat] Failed to check subscription status:", error);
    return false;
  }
};

/**
 * Restore previous purchases
 */
export const restorePurchases = async (): Promise<boolean> => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return (
      typeof customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM] !==
      "undefined"
    );
  } catch (error) {
    console.error("[RevenueCat] Failed to restore purchases:", error);
    return false;
  }
};

/**
 * Set user ID for RevenueCat (useful when user signs in)
 */
export const setRevenueCatUserId = async (userId: string): Promise<void> => {
  try {
    await Purchases.logIn(userId);
    console.log("[RevenueCat] User ID set successfully:", userId);
  } catch (error) {
    console.error("[RevenueCat] Failed to set user ID:", error);
    throw error;
  }
};

/**
 * Log out user from RevenueCat (useful when user signs out)
 */
export const logOutRevenueCatUser = async (): Promise<void> => {
  try {
    await Purchases.logOut();
    console.log("[RevenueCat] User logged out successfully");
  } catch (error) {
    console.error("[RevenueCat] Failed to log out user:", error);
    throw error;
  }
};

// Export types for use in other files
export type { PurchasesOffering } from "react-native-purchases";
