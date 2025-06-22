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
import { useAuth } from "./AuthContext";
import { useRecipes } from "./RecipeContext";

interface SubscriptionContextType {
  // Subscription state
  isPremium: boolean;
  isLoading: boolean;
  currentOffering: PurchasesOffering | null;

  // Actions
  checkSubscription: () => Promise<void>;
  presentPaywall: (feature?: string) => Promise<boolean>;
  presentPaywallIfNeeded: (feature?: string) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;

  // Feature gating
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

  const { user } = useAuth();
  const { recipes } = useRecipes();

  // Initialize RevenueCat when user changes
  useEffect(() => {
    if (user?.id) {
      setRevenueCatUserId(user.id);
    } else {
      logOutRevenueCatUser();
    }
  }, [user?.id]);

  // Check subscription status and load offerings
  const checkSubscription = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check current subscription status
      const hasPremium = await checkSubscriptionStatus();
      console.log("[SubscriptionContext] Premium status:", hasPremium);
      setIsPremium(hasPremium);

      // Load current offering for paywall
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

  // Check subscription on mount and when user changes
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Present RevenueCat paywall for specific feature
  const presentPaywall = useCallback(
    async (feature?: string): Promise<boolean> => {
      try {
        // Safety check - don't show paywall if no offering available
        if (!currentOffering) {
          console.warn(
            "[SubscriptionContext] No offering available - cannot show paywall"
          );
          console.log(
            "[SubscriptionContext] Current offering state:",
            currentOffering
          );
          return false;
        }

        console.log(
          "[SubscriptionContext] Showing paywall for feature:",
          feature
        );
        console.log("[SubscriptionContext] Using offering:", {
          identifier: currentOffering.identifier,
          packages: currentOffering.availablePackages.map(
            (pkg) => pkg.identifier
          ),
        });

        const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall(
          {
            offering: currentOffering,
          }
        );

        console.log("[SubscriptionContext] Paywall result:", paywallResult);

        switch (paywallResult) {
          case PAYWALL_RESULT.PURCHASED:
          case PAYWALL_RESULT.RESTORED:
            // Refresh subscription status after successful purchase/restore
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

  // Feature gating helpers
  const canAccessFeature = useCallback(
    (feature: string): boolean => {
      if (isPremium) return true;

      // Define which features require premium
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

  // Present paywall only if needed (user doesn't have access)
  const presentPaywallIfNeeded = useCallback(
    async (feature?: string): Promise<boolean> => {
      // If user is already premium, no need to show paywall
      if (isPremium) {
        return true;
      }

      // If feature is specified, check if it requires premium
      if (feature && canAccessFeature(feature)) {
        return true;
      }

      // Show paywall since user needs premium
      return presentPaywall(feature);
    },
    [isPremium, canAccessFeature, presentPaywall]
  );

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await restoreRevenueCatPurchases();
      setIsPremium(success);

      if (success) {
        await checkSubscription(); // Refresh all subscription data
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
    if (isPremium) return -1; // Unlimited

    // Get actual recipe count from RecipeContext
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
