import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useSubscription } from "@/context/SubscriptionContext";

export interface FeatureGatingOptions {
  showAlert?: boolean;
  alertTitle?: string;
  alertMessage?: string;
}

/**
 * Hook for feature gating and subscription management
 * Provides easy access to subscription status and paywall functionality
 */
export const useFeatureGating = () => {
  const [paywallVisible, setPaywallVisible] = useState(false);

  const {
    isPremium,
    isLoading,
    currentOffering,
    presentPaywall,
    presentPaywallIfNeeded,
    restorePurchases,
    canAccessFeature,
    getRemainingRecipeCount,
    canAddRecipe,
  } = useSubscription();

  /**
   * Check if user can access a feature, with optional paywall presentation
   * @param feature - Feature identifier
   * @param options - Configuration options
   * @returns Promise<boolean> - Whether user has access after check
   */
  const checkFeatureAccess = useCallback(
    async (
      feature: string,
      options: FeatureGatingOptions = {}
    ): Promise<boolean> => {
      const { showAlert = true, alertTitle, alertMessage } = options;

      if (canAccessFeature(feature)) {
        return true;
      }

      // Feature requires premium - show paywall
      const hasAccess = await presentPaywallIfNeeded(feature);

      if (!hasAccess && showAlert) {
        Alert.alert(
          alertTitle || "Premium Feature",
          alertMessage ||
            `This feature requires a premium subscription. Would you like to upgrade?`,
          [
            { text: "Maybe Later", style: "cancel" },
            {
              text: "Upgrade",
              onPress: () => presentPaywall(feature),
            },
          ]
        );
      }

      return hasAccess;
    },
    [canAccessFeature, presentPaywallIfNeeded, presentPaywall]
  );

  /**
   * Check if user can add a recipe (respects 10 recipe limit for free users)
   * @param options - Configuration options
   * @returns Promise<boolean> - Whether user can add recipe
   */
  const checkRecipeLimit = useCallback(
    async (options: FeatureGatingOptions = {}): Promise<boolean> => {
      if (canAddRecipe()) {
        return true;
      }

      const { showAlert = true } = options;
      const remaining = getRemainingRecipeCount();

      if (remaining <= 0) {
        const hasAccess = await presentPaywallIfNeeded("unlimited_recipes");

        if (!hasAccess && showAlert) {
          Alert.alert(
            "Recipe Limit Reached",
            "Free users can save up to 10 recipes. Upgrade to Premium for unlimited recipes!",
            [
              { text: "Maybe Later", style: "cancel" },
              {
                text: "Upgrade to Premium",
                onPress: () => presentPaywall("unlimited_recipes"),
              },
            ]
          );
        }

        return hasAccess;
      }

      return true;
    },
    [
      canAddRecipe,
      getRemainingRecipeCount,
      presentPaywallIfNeeded,
      presentPaywall,
    ]
  );

  /**
   * Get user-friendly subscription status text
   */
  const getSubscriptionStatusText = useCallback((): string => {
    if (isLoading) return "Checking subscription...";
    if (isPremium) return "Premium Active";

    const remaining = getRemainingRecipeCount();
    if (remaining === -1) return "Premium Active";
    return `Free Plan (${remaining}/10 recipes)`;
  }, [isLoading, isPremium, getRemainingRecipeCount]);

  /**
   * Feature-specific access checkers
   */
  const featureCheckers = {
    // Recipe Management
    canExtractFromURL: () => canAccessFeature("recipe_url_extraction"),
    canExportRecipes: () => canAccessFeature("recipe_export"),
    canBulkImport: () => canAccessFeature("bulk_import_export"),
    canAccessPremiumCollections: () => canAccessFeature("premium_collections"),

    // Meal Planning
    canAccessAdvancedMealPlanning: () =>
      canAccessFeature("advanced_meal_planning"),
    canGenerateShoppingLists: () =>
      canAccessFeature("shopping_list_generation"),

    // Analysis & Sync
    canAccessNutritionAnalysis: () => canAccessFeature("nutrition_analysis"),
    canSyncAcrossDevices: () => canAccessFeature("cross_device_sync"),

    // Recipe limit
    hasUnlimitedRecipes: () => canAccessFeature("unlimited_recipes"),
  };

  return {
    // Subscription state
    isPremium,
    isLoading,
    currentOffering,

    // Paywall visibility
    paywallVisible,
    setPaywallVisible,

    // Core actions
    checkFeatureAccess,
    checkRecipeLimit,
    presentPaywall,
    presentPaywallIfNeeded,
    restorePurchases,

    // Helpers
    getSubscriptionStatusText,
    getRemainingRecipeCount,
    canAddRecipe,

    // Feature checkers
    ...featureCheckers,
  };
};
