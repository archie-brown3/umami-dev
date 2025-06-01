// Premium Features Configuration for Recipe App
export interface FeatureLimits {
  recipes: {
    maxRecipes: number;
    unlimited: boolean;
  };
  mealPlanning: {
    maxWeeksAhead: number;
    maxWeeksBehind: number;
    unlimited: boolean;
  };
  shoppingLists: {
    autoGeneration: boolean;
    smartConsolidation: boolean;
    exportFeatures: boolean;
  };
  textRecognition: {
    enabled: boolean;
    maxScansPerMonth: number;
  };
  cloudSync: {
    enabled: boolean;
    backupRestore: boolean;
  };
  export: {
    pdfExport: boolean;
    bulkExport: boolean;
    recipeSharing: boolean;
  };
  advanced: {
    nutritionAnalysis: boolean;
    recipeTags: boolean;
    customCategories: boolean;
    recipeRatings: boolean;
  };
}

// Free tier limitations
export const FREE_TIER_LIMITS: FeatureLimits = {
  recipes: {
    maxRecipes: 10,
    unlimited: false,
  },
  mealPlanning: {
    maxWeeksAhead: 1,
    maxWeeksBehind: 0,
    unlimited: false,
  },
  shoppingLists: {
    autoGeneration: false,
    smartConsolidation: false,
    exportFeatures: false,
  },
  textRecognition: {
    enabled: false,
    maxScansPerMonth: 0,
  },
  cloudSync: {
    enabled: false,
    backupRestore: false,
  },
  export: {
    pdfExport: false,
    bulkExport: false,
    recipeSharing: false,
  },
  advanced: {
    nutritionAnalysis: false,
    recipeTags: false,
    customCategories: false,
    recipeRatings: false,
  },
};

// Premium tier features
export const PREMIUM_TIER_LIMITS: FeatureLimits = {
  recipes: {
    maxRecipes: -1, // -1 means unlimited
    unlimited: true,
  },
  mealPlanning: {
    maxWeeksAhead: 12,
    maxWeeksBehind: 4,
    unlimited: true,
  },
  shoppingLists: {
    autoGeneration: true,
    smartConsolidation: true,
    exportFeatures: true,
  },
  textRecognition: {
    enabled: true,
    maxScansPerMonth: -1, // unlimited
  },
  cloudSync: {
    enabled: true,
    backupRestore: true,
  },
  export: {
    pdfExport: true,
    bulkExport: true,
    recipeSharing: true,
  },
  advanced: {
    nutritionAnalysis: true,
    recipeTags: true,
    customCategories: true,
    recipeRatings: true,
  },
};

// Feature identifiers for easy reference
export const PREMIUM_FEATURES = {
  UNLIMITED_RECIPES: "unlimited_recipes",
  ADVANCED_MEAL_PLANNING: "advanced_meal_planning",
  AUTO_SHOPPING_LISTS: "auto_shopping_lists",
  TEXT_RECOGNITION: "text_recognition",
  CLOUD_SYNC: "cloud_sync",
  PDF_EXPORT: "pdf_export",
  NUTRITION_ANALYSIS: "nutrition_analysis",
  RECIPE_TAGS: "recipe_tags",
  BULK_OPERATIONS: "bulk_operations",
} as const;

// User-friendly feature descriptions
export const FEATURE_DESCRIPTIONS = {
  [PREMIUM_FEATURES.UNLIMITED_RECIPES]: {
    title: "Unlimited Recipes",
    description: "Save as many recipes as you want",
    freeLimit: "10 recipes max",
    premiumBenefit: "Unlimited storage",
  },
  [PREMIUM_FEATURES.ADVANCED_MEAL_PLANNING]: {
    title: "Advanced Meal Planning",
    description: "Plan meals weeks ahead and behind",
    freeLimit: "1 week ahead only",
    premiumBenefit: "12 weeks ahead, 4 weeks behind",
  },
  [PREMIUM_FEATURES.AUTO_SHOPPING_LISTS]: {
    title: "Smart Shopping Lists",
    description: "Auto-generate and consolidate shopping lists",
    freeLimit: "Manual lists only",
    premiumBenefit: "Auto-generation from meal plans",
  },
  [PREMIUM_FEATURES.TEXT_RECOGNITION]: {
    title: "Recipe Text Recognition",
    description: "Extract recipes from photos and websites",
    freeLimit: "Not available",
    premiumBenefit: "Unlimited text recognition",
  },
  [PREMIUM_FEATURES.CLOUD_SYNC]: {
    title: "Cloud Sync & Backup",
    description: "Sync across devices with automatic backup",
    freeLimit: "Local storage only",
    premiumBenefit: "Cloud sync + backup restore",
  },
  [PREMIUM_FEATURES.PDF_EXPORT]: {
    title: "Export & Sharing",
    description: "Export recipes to PDF and share easily",
    freeLimit: "Basic sharing only",
    premiumBenefit: "PDF export + bulk operations",
  },
  [PREMIUM_FEATURES.NUTRITION_ANALYSIS]: {
    title: "Nutrition Analysis",
    description: "Get nutritional information for recipes",
    freeLimit: "Not available",
    premiumBenefit: "Full nutrition tracking",
  },
  [PREMIUM_FEATURES.RECIPE_TAGS]: {
    title: "Advanced Organization",
    description: "Custom tags, categories, and ratings",
    freeLimit: "Basic categories only",
    premiumBenefit: "Custom tags + ratings",
  },
};

// Helper type for feature checking
export type PremiumFeature = keyof typeof PREMIUM_FEATURES;
