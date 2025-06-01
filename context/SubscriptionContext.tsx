import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform, Alert } from "react-native";
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from "react-native-purchases";
import { useAuth } from "./AuthContext";

// RevenueCat API Keys - Replace with your actual keys
const REVENUECAT_API_KEYS = {
  ios:
    process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "your_ios_api_key_here",
  android:
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ||
    "your_android_api_key_here",
};

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOffering | null;
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  checkSubscriptionStatus: () => Promise<void>;
  initializeRevenueCat: (userId?: string) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);

  const { user } = useAuth();

  // Initialize RevenueCat SDK
  const initializeRevenueCat = async (userId?: string) => {
    try {
      console.log("[RevenueCat] Initializing SDK...");

      // Set log level for debugging
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

      // Configure SDK with platform-specific API key
      if (Platform.OS === "ios") {
        await Purchases.configure({
          apiKey: REVENUECAT_API_KEYS.ios,
          appUserID: userId,
        });
      } else if (Platform.OS === "android") {
        await Purchases.configure({
          apiKey: REVENUECAT_API_KEYS.android,
          appUserID: userId,
        });
      }

      console.log("[RevenueCat] SDK initialized successfully");

      // Load initial data
      await checkSubscriptionStatus();
      await loadOfferings();
    } catch (error) {
      console.error("[RevenueCat] Failed to initialize:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check current subscription status
  const checkSubscriptionStatus = async () => {
    try {
      console.log("[RevenueCat] Checking subscription status...");
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);

      // Check if user has premium entitlement
      const hasPremium =
        typeof info.entitlements.active["premium_access"] !== "undefined";
      setIsPremium(hasPremium);

      console.log("[RevenueCat] Premium status:", hasPremium);
    } catch (error) {
      console.error("[RevenueCat] Error checking subscription status:", error);
      setIsPremium(false);
    }
  };

  // Load available offerings
  const loadOfferings = async () => {
    try {
      console.log("[RevenueCat] Loading offerings...");
      const offerings = await Purchases.getOfferings();

      if (offerings.current !== null) {
        setOfferings(offerings.current);
        console.log(
          "[RevenueCat] Offerings loaded:",
          offerings.current.identifier
        );
      } else {
        console.log("[RevenueCat] No offerings found");
      }
    } catch (error) {
      console.error("[RevenueCat] Error loading offerings:", error);
    }
  };

  // Purchase a package
  const purchasePackage = async (
    packageToPurchase: PurchasesPackage
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log(
        "[RevenueCat] Purchasing package:",
        packageToPurchase.identifier
      );

      const { customerInfo } = await Purchases.purchasePackage(
        packageToPurchase
      );
      setCustomerInfo(customerInfo);

      const hasPremium =
        typeof customerInfo.entitlements.active["premium_access"] !==
        "undefined";
      setIsPremium(hasPremium);

      if (hasPremium) {
        Alert.alert(
          "Purchase Successful!",
          "Welcome to Premium! You now have access to all features.",
          [{ text: "OK" }]
        );
      }

      return hasPremium;
    } catch (error: any) {
      console.error("[RevenueCat] Purchase error:", error);

      if (!error.userCancelled) {
        Alert.alert(
          "Purchase Failed",
          error.message || "Failed to complete purchase. Please try again.",
          [{ text: "OK" }]
        );
      }

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Restore purchases
  const restorePurchases = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("[RevenueCat] Restoring purchases...");

      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);

      const hasPremium =
        typeof info.entitlements.active["premium_access"] !== "undefined";
      setIsPremium(hasPremium);

      if (hasPremium) {
        Alert.alert(
          "Purchases Restored!",
          "Your premium subscription has been restored.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "No Purchases Found",
          "No active subscriptions were found to restore.",
          [{ text: "OK" }]
        );
      }

      return hasPremium;
    } catch (error: any) {
      console.error("[RevenueCat] Restore error:", error);
      Alert.alert(
        "Restore Failed",
        error.message || "Failed to restore purchases. Please try again.",
        [{ text: "OK" }]
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize when user changes
  useEffect(() => {
    if (user?.id) {
      initializeRevenueCat(user.id);
    }
  }, [user?.id]);

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isLoading,
        customerInfo,
        offerings,
        purchasePackage,
        restorePurchases,
        checkSubscriptionStatus,
        initializeRevenueCat,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
};
