import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { CustomerInfo, PurchasesOffering } from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import {
  checkSubscriptionStatus,
  getOfferings,
  restorePurchases as restoreRevenueCatPurchases,
  setRevenueCatUserId,
  logOutRevenueCatUser,
} from "@/lib/revenuecat";
import { useRecipes } from "./RecipeContext";
import { demoUser } from "@/lib/demoData";

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  currentOffering: PurchasesOffering | null;
  checkSubscription: () => Promise<void>;
  presentPaywall: (feature?: string) => Promise<boolean>;
  presentPaywallIfNeeded: (feature?: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  canAccessFeature: (feature: string) => boolean;
  getRemainingRecipeCount: () => number;
  canAddRecipe: () => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentOffering, setCurrentOffering] =
    useState<PurchasesOffering | null>(null);

  const { recipes } = useRecipes();

  useEffect(() => {
    setRevenueCatUserId(demoUser.id);
  }, []);

  const checkSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      const hasPremium = await checkSubscriptionStatus();
      console.log("[SubscriptionContext] Premium status:", hasPremium);
      setIsPremium(hasPremium);
      const offering = await getOfferings();
      console.log("[SubscriptionContext] Available offering:", {
        identifier: offering?.identifier,
        availablePackages: offering?.availablePackages?.length || 0,
      });
      setCurrentOffering(offering);
    } catch (error) {
      console.error(
        "[SubscriptionContext] Error checking subscription:",
        error
      );
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const presentPaywall = useCallback(
    async (feature?: string): Promise<boolean> => {
      try {
        if (!currentOffering) {
          console.warn(
            "[SubscriptionContext] No offering available - cannot show paywall"
          );
          return false;
        }

        const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall(
          { offering: currentOffering }
        );

        switch (paywallResult) {
          case PAYWALL_RESULT.PURCHASED:
          case PAYWALL_RESULT.RESTORED:
            await checkSubscription();
            console.log(
              `[SubscriptionContext] Purchase successful for feature: ${feature}`
            );
            return true;
          case PAYWALL_RESULT.CANCELLED:
            console.log(
              `[SubscriptionContext] Paywall cancelled for feature: ${feature}`
            );
            return false;
          case PAYWALL_RESULT.NOT_PRESENTED:
          case PAYWALL_RESULT.ERROR:
          default:
            console.warn(
              `[SubscriptionContext] Paywall error for feature: ${feature}`,
              paywallResult
            );
            return false;
        }
      } catch (error) {
        console.error("[SubscriptionContext] Error presenting paywall:", error);
        return false;
      }
    },
    [currentOffering, checkSubscription]
  );

  const canAccessFeature = useCallback(
    (feature: string): boolean => {
      if (isPremium) return true;
      const premiumFeatures = [
        "unlimited_recipes",
        "advanced_meal_planning",
        "recipe_url_extraction",
        "shopping_list_generation",
        "recipe_export",
        "cross_device_sync",
        "nutrition_analysis",
        "bulk_import_export",
        "premium_collections",
      ];
      return !premiumFeatures.includes(feature);
    },
    [isPremium]
  );

  const presentPaywallIfNeeded = useCallback(
    async (feature?: string): Promise<boolean> => {
      if (isPremium) return true;
      if (feature && canAccessFeature(feature)) return true;
      return presentPaywall(feature);
    },
    [isPremium, canAccessFeature, presentPaywall]
  );

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await restoreRevenueCatPurchases();
      setIsPremium(success);
      if (success) {
        await checkSubscription();
      }
      return success;
    } catch (error) {
      console.error("[SubscriptionContext] Error restoring purchases:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [checkSubscription]);

  const getRemainingRecipeCount = useCallback((): number => {
    if (isPremium) return -1;
    const currentRecipeCount = recipes?.length || 0;
    return Math.max(0, 10 - currentRecipeCount);
  }, [isPremium, recipes?.length]);

  const canAddRecipe = useCallback((): boolean => {
    if (isPremium) return true;
    const remaining = getRemainingRecipeCount();
    return remaining > 0;
  }, [isPremium, getRemainingRecipeCount]);

  const value: SubscriptionContextType = {
    isPremium,
    isLoading,
    currentOffering,
    checkSubscription,
    presentPaywall,
    presentPaywallIfNeeded,
    restorePurchases,
    canAccessFeature,
    getRemainingRecipeCount,
    canAddRecipe,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
};
