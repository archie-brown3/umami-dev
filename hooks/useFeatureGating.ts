import { useSubscription } from "@/context/SubscriptionContext";
import {
  FREE_TIER_LIMITS,
  PREMIUM_TIER_LIMITS,
  PREMIUM_FEATURES,
  FeatureLimits,
  PremiumFeature,
} from "@/constants/premiumFeatures";
import { useState } from "react";

interface FeatureCheck {
  hasAccess: boolean;
  limit?: number;
  used?: number;
  remaining?: number;
  showPaywall: () => void;
}

export const useFeatureGating = () => {
  const { isPremium } = useSubscription();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState<string>("");

  // Get current user limits based on subscription status
  const getCurrentLimits = (): FeatureLimits => {
    return isPremium ? PREMIUM_TIER_LIMITS : FREE_TIER_LIMITS;
  };

  // Check if user has access to a specific feature
  const checkFeatureAccess = (
    feature: keyof typeof PREMIUM_FEATURES,
    currentUsage?: number
  ): FeatureCheck => {
    const limits = getCurrentLimits();

    const showPaywall = () => {
      setBlockedFeature(feature);
      setPaywallVisible(true);
    };

    switch (feature) {
      case "UNLIMITED_RECIPES":
        return {
          hasAccess:
            limits.recipes.unlimited ||
            (currentUsage || 0) < limits.recipes.maxRecipes,
          limit: limits.recipes.maxRecipes,
          used: currentUsage,
          remaining: limits.recipes.unlimited
            ? -1
            : Math.max(0, limits.recipes.maxRecipes - (currentUsage || 0)),
          showPaywall,
        };

      case "ADVANCED_MEAL_PLANNING":
        return {
          hasAccess: limits.mealPlanning.unlimited,
          limit: limits.mealPlanning.maxWeeksAhead,
          showPaywall,
        };

      case "AUTO_SHOPPING_LISTS":
        return {
          hasAccess: limits.shoppingLists.autoGeneration,
          showPaywall,
        };

      case "TEXT_RECOGNITION":
        return {
          hasAccess: limits.textRecognition.enabled,
          limit: limits.textRecognition.maxScansPerMonth,
          used: currentUsage,
          remaining:
            limits.textRecognition.maxScansPerMonth === -1
              ? -1
              : Math.max(
                  0,
                  limits.textRecognition.maxScansPerMonth - (currentUsage || 0)
                ),
          showPaywall,
        };

      case "CLOUD_SYNC":
        return {
          hasAccess: limits.cloudSync.enabled,
          showPaywall,
        };

      case "PDF_EXPORT":
        return {
          hasAccess: limits.export.pdfExport,
          showPaywall,
        };

      case "NUTRITION_ANALYSIS":
        return {
          hasAccess: limits.advanced.nutritionAnalysis,
          showPaywall,
        };

      case "RECIPE_TAGS":
        return {
          hasAccess: limits.advanced.recipeTags,
          showPaywall,
        };

      case "BULK_OPERATIONS":
        return {
          hasAccess: limits.export.bulkExport,
          showPaywall,
        };

      default:
        return {
          hasAccess: isPremium,
          showPaywall,
        };
    }
  };

  // Convenient helper functions
  const canAddRecipe = (currentRecipeCount: number) =>
    checkFeatureAccess("UNLIMITED_RECIPES", currentRecipeCount);

  const canUseMealPlanning = (weeksFromNow: number) => {
    const limits = getCurrentLimits();
    const hasAccess =
      Math.abs(weeksFromNow) <= limits.mealPlanning.maxWeeksAhead;
    return {
      hasAccess,
      showPaywall: () => {
        setBlockedFeature("ADVANCED_MEAL_PLANNING");
        setPaywallVisible(true);
      },
    };
  };

  const canUseTextRecognition = (currentUsage: number = 0) =>
    checkFeatureAccess("TEXT_RECOGNITION", currentUsage);

  const canExportToPDF = () => checkFeatureAccess("PDF_EXPORT");

  const canUseCloudSync = () => checkFeatureAccess("CLOUD_SYNC");

  // Feature gate wrapper for UI components
  const withFeatureGate = (
    feature: keyof typeof PREMIUM_FEATURES,
    component: React.ReactNode,
    fallback?: React.ReactNode
  ) => {
    const { hasAccess } = checkFeatureAccess(feature);
    return hasAccess ? component : fallback;
  };

  return {
    // Core functions
    checkFeatureAccess,
    getCurrentLimits,
    isPremium,

    // Convenience functions
    canAddRecipe,
    canUseMealPlanning,
    canUseTextRecognition,
    canExportToPDF,
    canUseCloudSync,
    withFeatureGate,

    // Paywall state
    paywallVisible,
    setPaywallVisible,
    blockedFeature,

    // Quick access to limits
    limits: getCurrentLimits(),
  };
};
