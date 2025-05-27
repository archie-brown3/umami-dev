import { Recipe } from "@/types";

export interface TagCategory {
  name: string;
  tags: { tag: string; count: number }[];
  color: string;
  icon?: string;
}

export interface ProcessedTags {
  categories: TagCategory[];
  allTags: { tag: string; count: number }[];
}

// Comprehensive food-related tag patterns for strict validation
const VALID_FOOD_TAGS = {
  // Cuisine types
  cuisine: [
    "italian",
    "mexican",
    "thai",
    "american",
    "chinese",
    "indian",
    "french",
    "mediterranean",
    "asian",
    "spanish",
    "japanese",
    "korean",
    "greek",
    "middle eastern",
    "moroccan",
    "vietnamese",
    "german",
    "british",
    "cajun",
    "tex-mex",
    "fusion",
    "latin",
    "caribbean",
    "african",
    "scandinavian",
  ],

  // Dietary restrictions and preferences
  dietary: [
    "vegetarian",
    "vegan",
    "gluten-free",
    "dairy-free",
    "keto",
    "paleo",
    "low-carb",
    "healthy",
    "low-fat",
    "sugar-free",
    "nut-free",
    "soy-free",
    "egg-free",
    "pescatarian",
    "raw",
    "whole30",
    "low-sodium",
    "diabetic-friendly",
  ],

  // Meal types
  mealType: [
    "breakfast",
    "lunch",
    "dinner",
    "snack",
    "dessert",
    "appetizer",
    "brunch",
    "side dish",
    "main course",
    "salad",
    "soup",
    "beverage",
    "cocktail",
    "smoothie",
  ],

  // Difficulty levels
  difficulty: [
    "easy",
    "medium",
    "hard",
    "quick",
    "beginner",
    "advanced",
    "simple",
    "complex",
    "no cook",
    "one pot",
    "30 minute",
    "15 minute",
    "slow cook",
  ],

  // Protein sources
  protein: [
    "chicken",
    "beef",
    "pork",
    "fish",
    "seafood",
    "salmon",
    "tuna",
    "shrimp",
    "turkey",
    "lamb",
    "duck",
    "tofu",
    "beans",
    "lentils",
    "quinoa",
    "eggs",
    "cheese",
    "nuts",
    "seeds",
    "tempeh",
    "seitan",
    "high protein",
  ],

  // Cooking methods
  cooking: [
    "baked",
    "grilled",
    "fried",
    "roasted",
    "steamed",
    "boiled",
    "sautéed",
    "slow-cooked",
    "pressure cooked",
    "air fried",
    "broiled",
    "braised",
    "poached",
    "smoked",
    "barbecued",
    "stir-fried",
    "pan-fried",
    "deep-fried",
  ],

  // Flavor profiles
  flavors: [
    "spicy",
    "sweet",
    "savory",
    "sour",
    "salty",
    "umami",
    "tangy",
    "mild",
    "hot",
    "smoky",
    "creamy",
    "crispy",
    "crunchy",
    "tender",
    "juicy",
    "rich",
    "light",
    "fresh",
    "zesty",
    "aromatic",
    "bold",
    "delicate",
  ],

  // Main ingredients
  mainIngredients: [
    "chicken",
    "beef",
    "pork",
    "fish",
    "pasta",
    "rice",
    "potato",
    "tomato",
    "cheese",
    "chocolate",
    "bread",
    "egg",
    "milk",
    "flour",
    "sugar",
    "garlic",
    "onion",
    "mushroom",
    "spinach",
    "avocado",
    "lemon",
    "lime",
    "herbs",
    "spices",
  ],

  // Occasions and timing
  occasions: [
    "weeknight",
    "weekend",
    "holiday",
    "party",
    "family",
    "date night",
    "potluck",
    "picnic",
    "bbq",
    "comfort food",
    "summer",
    "winter",
    "fall",
    "spring",
  ],

  // Nutritional aspects
  nutrition: [
    "low calorie",
    "high fiber",
    "antioxidant",
    "vitamin c",
    "iron rich",
    "calcium rich",
    "omega 3",
    "probiotic",
    "superfood",
    "whole grain",
  ],
};

// Tag categorization patterns - Updated to be more comprehensive
export const TAG_CATEGORIES = {
  cuisine: {
    name: "Cuisine",
    color: "#FF6B6B",
    icon: "🌍",
    patterns: [
      "italian",
      "mexican",
      "thai",
      "american",
      "chinese",
      "indian",
      "french",
      "mediterranean",
      "asian",
      "spanish",
      "japanese",
      "korean",
      "greek",
      "middle eastern",
      "moroccan",
      "vietnamese",
      "german",
      "british",
      "cajun",
      "tex-mex",
      "fusion",
      "latin",
      "caribbean",
      "african",
      "scandinavian",
    ],
  },
  dietary: {
    name: "Dietary",
    color: "#4ECDC4",
    icon: "🥗",
    patterns: [
      "vegetarian",
      "vegan",
      "gluten-free",
      "dairy-free",
      "keto",
      "paleo",
      "low-carb",
      "healthy",
      "low-fat",
      "sugar-free",
      "nut-free",
      "soy-free",
      "egg-free",
      "pescatarian",
      "raw",
      "whole30",
      "low-sodium",
      "diabetic-friendly",
      "low calorie",
      "high fiber",
      "antioxidant",
      "vitamin c",
      "iron rich",
      "calcium rich",
      "omega 3",
      "probiotic",
      "superfood",
      "whole grain",
    ],
  },
  mealType: {
    name: "Meal Type",
    color: "#45B7D1",
    icon: "🍽️",
    patterns: [
      "breakfast",
      "lunch",
      "dinner",
      "snack",
      "dessert",
      "appetizer",
      "brunch",
      "side dish",
      "main course",
      "salad",
      "soup",
      "beverage",
      "cocktail",
      "smoothie",
    ],
  },
  difficulty: {
    name: "Difficulty",
    color: "#96CEB4",
    icon: "⭐",
    patterns: [
      "easy",
      "medium",
      "hard",
      "quick",
      "beginner",
      "advanced",
      "simple",
      "complex",
      "no cook",
      "one pot",
      "30 minute",
      "15 minute",
      "slow cook",
      "weeknight",
      "weekend",
    ],
  },
  protein: {
    name: "Protein",
    color: "#FECA57",
    icon: "🥩",
    patterns: [
      "chicken",
      "beef",
      "pork",
      "fish",
      "seafood",
      "salmon",
      "tuna",
      "shrimp",
      "turkey",
      "lamb",
      "duck",
      "tofu",
      "beans",
      "lentils",
      "quinoa",
      "eggs",
      "cheese",
      "nuts",
      "seeds",
      "tempeh",
      "seitan",
      "high protein",
      "main:",
    ],
  },
  cooking: {
    name: "Cooking Method",
    color: "#FF9FF3",
    icon: "🔥",
    patterns: [
      "baked",
      "grilled",
      "fried",
      "roasted",
      "steamed",
      "boiled",
      "sautéed",
      "slow-cooked",
      "pressure cooked",
      "air fried",
      "broiled",
      "braised",
      "poached",
      "smoked",
      "barbecued",
      "stir-fried",
      "pan-fried",
      "deep-fried",
      "bake",
      "grill",
      "fry",
      "roast",
      "steam",
      "boil",
      "sauté",
      "slow-cook",
    ],
  },
  flavors: {
    name: "Flavors",
    color: "#A78BFA",
    icon: "👅",
    patterns: [
      "spicy",
      "sweet",
      "savory",
      "sour",
      "salty",
      "umami",
      "tangy",
      "mild",
      "hot",
      "smoky",
      "creamy",
      "crispy",
      "crunchy",
      "tender",
      "juicy",
      "rich",
      "light",
      "fresh",
      "zesty",
      "aromatic",
      "bold",
      "delicate",
      "flavor:",
    ],
  },
};

// Country flag mapping for cuisine tags
const CUISINE_FLAGS: { [key: string]: string } = {
  italian: "🇮🇹",
  mexican: "🇲🇽",
  thai: "🇹🇭",
  american: "🇺🇸",
  chinese: "🇨🇳",
  indian: "🇮🇳",
  french: "🇫🇷",
  mediterranean: "🌊", // Using ocean wave for Mediterranean region
  asian: "🌏", // Using Asia-Pacific globe
  spanish: "🇪🇸",
  japanese: "🇯🇵",
  korean: "🇰🇷",
  greek: "🇬🇷",
  "middle eastern": "🌍", // Using globe for Middle East region
  moroccan: "🇲🇦",
  vietnamese: "🇻🇳",
  german: "🇩🇪",
  british: "🇬🇧",
  cajun: "🇺🇸", // Louisiana/US
  "tex-mex": "🇺🇸", // Texas/US
  fusion: "🌐", // Global fusion
  latin: "🌎", // Latin America
  caribbean: "🏝️", // Island for Caribbean
  african: "🌍", // Africa globe
  scandinavian: "🇸🇪", // Using Sweden flag for Scandinavian
};

/**
 * Normalize tag name for storage (lowercase, trimmed)
 */
export function normalizeTagName(tag: string): string {
  return tag.trim().toLowerCase();
}

/**
 * Format tag name for display (convert underscores to spaces and capitalize properly)
 */
export function formatTagName(tag: string): string {
  return tag
    .replace(/_/g, " ") // Convert underscores to spaces
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Categorize a tag based on predefined patterns
 */
export function categorizeTag(
  tag: string
): keyof typeof TAG_CATEGORIES | "other" {
  const normalizedTag = normalizeTagName(tag);

  for (const [categoryKey, category] of Object.entries(TAG_CATEGORIES)) {
    if (category.patterns.some((pattern) => normalizedTag.includes(pattern))) {
      return categoryKey as keyof typeof TAG_CATEGORIES;
    }
  }

  return "other";
}

/**
 * Extract and process all tags from recipes into organized categories
 */
export function processRecipeTags(recipes: Recipe[]): ProcessedTags {
  const tagCounts = new Map<string, number>();

  // Extract all tags and count frequency
  recipes.forEach((recipe) => {
    const recipeTags = recipe.tags || [];
    recipeTags.forEach((tag) => {
      if (tag && tag.trim()) {
        const normalizedTag = normalizeTagName(tag);
        tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
      }
    });
  });

  // Convert to array and sort by frequency
  const allTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  // Categorize tags
  const categorizedTags = new Map<string, { tag: string; count: number }[]>();

  allTags.forEach(({ tag, count }) => {
    const category = categorizeTag(tag);
    if (!categorizedTags.has(category)) {
      categorizedTags.set(category, []);
    }
    categorizedTags.get(category)!.push({ tag, count });
  });

  // Build category objects
  const categories: TagCategory[] = [];

  // Add predefined categories in order
  Object.entries(TAG_CATEGORIES).forEach(([key, categoryDef]) => {
    const categoryTags = categorizedTags.get(key) || [];
    if (categoryTags.length > 0) {
      categories.push({
        name: categoryDef.name,
        tags: categoryTags.sort((a, b) => b.count - a.count),
        color: categoryDef.color,
        icon: categoryDef.icon,
      });
    }
  });

  // Add 'other' category at the end if it has tags
  const otherTags = categorizedTags.get("other") || [];
  if (otherTags.length > 0) {
    categories.push({
      name: "Other",
      tags: otherTags.sort((a, b) => b.count - a.count),
      color: "#A0A0A0",
      icon: "🏷️",
    });
  }

  return {
    categories,
    allTags,
  };
}

/**
 * Get the category color for a tag
 */
export function getTagCategoryColor(tag: string): string {
  const category = categorizeTag(tag);
  return (
    TAG_CATEGORIES[category as keyof typeof TAG_CATEGORIES]?.color || "#A0A0A0"
  );
}

/**
 * Filter recipes by selected tags (intersection)
 */
export function filterRecipesByTags(
  recipes: Recipe[],
  selectedTags: string[]
): Recipe[] {
  if (selectedTags.length === 0) return recipes;

  return recipes.filter((recipe) => {
    const recipeTags = (recipe.tags || []).map((tag) => normalizeTagName(tag));
    return selectedTags.every((selectedTag) =>
      recipeTags.includes(normalizeTagName(selectedTag))
    );
  });
}

/**
 * Validate if a tag is food-related and should be allowed
 */
export function isValidFoodTag(tag: string): boolean {
  const normalizedTag = normalizeTagName(tag);

  // Check against all valid food tag categories
  for (const category of Object.values(VALID_FOOD_TAGS)) {
    if (
      category.some(
        (validTag) =>
          normalizedTag.includes(validTag) || validTag.includes(normalizedTag)
      )
    ) {
      return true;
    }
  }

  // Additional patterns for compound tags
  const foodPatterns = [
    /\b(main|side|flavor|difficulty|cuisine|diet|cook|bake|fry|grill|roast)\b/,
    /\b(protein|carb|fat|calorie|vitamin|mineral|fiber)\b/,
    /\b(breakfast|lunch|dinner|snack|dessert|appetizer)\b/,
    /\b(spicy|sweet|sour|salty|savory|umami|tangy|mild|hot)\b/,
    /\b(easy|medium|hard|quick|slow|simple|complex)\b/,
    /\b(healthy|fresh|organic|natural|homemade)\b/,
  ];

  return foodPatterns.some((pattern) => pattern.test(normalizedTag));
}

/**
 * Filter and clean tags to only include food-related ones
 */
export function filterFoodTags(tags: string[]): string[] {
  return tags
    .filter((tag) => tag && tag.trim())
    .map((tag) => normalizeTagName(tag))
    .filter((tag) => isValidFoodTag(tag))
    .map((tag) => formatTagName(tag))
    .filter((tag, index, array) => array.indexOf(tag) === index); // Remove duplicates
}

/**
 * Enhanced validation with detailed feedback for debugging
 */
export function validateAndCategorizeTags(tags: string[]): {
  validTags: string[];
  invalidTags: string[];
  categorizedTags: { [category: string]: string[] };
  feedback: string[];
} {
  const validTags: string[] = [];
  const invalidTags: string[] = [];
  const categorizedTags: { [category: string]: string[] } = {};
  const feedback: string[] = [];

  tags.forEach((tag) => {
    const normalizedTag = normalizeTagName(tag);

    if (isValidFoodTag(normalizedTag)) {
      const formattedTag = formatTagName(normalizedTag);
      validTags.push(formattedTag);

      // Categorize the valid tag
      const category = categorizeTag(normalizedTag);
      if (!categorizedTags[category]) {
        categorizedTags[category] = [];
      }
      categorizedTags[category].push(formattedTag);

      feedback.push(`✅ "${tag}" → "${formattedTag}" (${category})`);
    } else {
      invalidTags.push(tag);

      // Provide specific feedback on why it was rejected
      if (isGenericDescriptor(normalizedTag)) {
        feedback.push(`❌ "${tag}" - Generic descriptor (not recipe-specific)`);
      } else if (isSocialMediaTerm(normalizedTag)) {
        feedback.push(`❌ "${tag}" - Social media term (not culinary)`);
      } else if (isNonFoodTerm(normalizedTag)) {
        feedback.push(`❌ "${tag}" - Non-food related term`);
      } else {
        feedback.push(
          `❌ "${tag}" - Does not match any food category patterns`
        );
      }
    }
  });

  return {
    validTags: [...new Set(validTags)], // Remove duplicates
    invalidTags,
    categorizedTags,
    feedback,
  };
}

/**
 * Check if tag is a generic descriptor
 */
function isGenericDescriptor(tag: string): boolean {
  const genericTerms = [
    "delicious",
    "amazing",
    "perfect",
    "great",
    "awesome",
    "wonderful",
    "fantastic",
    "incredible",
    "best",
    "good",
    "nice",
    "yummy",
    "tasty",
    "recipe",
    "food",
    "dish",
    "meal",
    "cooking",
    "kitchen",
    "homemade",
  ];

  return genericTerms.some((term) => tag.includes(term) || term.includes(tag));
}

/**
 * Check if tag is a social media term
 */
function isSocialMediaTerm(tag: string): boolean {
  const socialTerms = [
    "instagram",
    "facebook",
    "twitter",
    "tiktok",
    "youtube",
    "social",
    "share",
    "like",
    "follow",
    "post",
    "viral",
    "trending",
    "hashtag",
    "influencer",
    "blogger",
    "content",
    "feed",
    "story",
    "reel",
  ];

  return socialTerms.some((term) => tag.includes(term) || term.includes(tag));
}

/**
 * Check if tag is non-food related
 */
function isNonFoodTerm(tag: string): boolean {
  const nonFoodTerms = [
    "photo",
    "picture",
    "image",
    "video",
    "camera",
    "filter",
    "weekend",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "morning",
    "afternoon",
    "evening",
    "night",
    "today",
    "yesterday",
    "love",
    "life",
    "happy",
    "fun",
    "enjoy",
    "relax",
    "chill",
  ];

  return nonFoodTerms.some((term) => tag.includes(term) || term.includes(tag));
}

/**
 * Enhanced food tag filtering with detailed logging
 */
export function filterFoodTagsWithFeedback(tags: string[]): {
  tags: string[];
  feedback: string[];
  stats: {
    original: number;
    valid: number;
    invalid: number;
    categories: { [key: string]: number };
  };
} {
  const result = validateAndCategorizeTags(tags);

  const stats = {
    original: tags.length,
    valid: result.validTags.length,
    invalid: result.invalidTags.length,
    categories: Object.fromEntries(
      Object.entries(result.categorizedTags).map(([cat, tags]) => [
        cat,
        tags.length,
      ])
    ),
  };

  return {
    tags: result.validTags,
    feedback: result.feedback,
    stats,
  };
}

export function getCuisineFlag(tag: string): string {
  const normalizedTag = tag.toLowerCase().trim();
  return CUISINE_FLAGS[normalizedTag] || "";
}
