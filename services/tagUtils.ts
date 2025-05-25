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

// Tag categorization patterns
const TAG_CATEGORIES = {
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
    ],
  },
  difficulty: {
    name: "Difficulty",
    color: "#96CEB4",
    icon: "⭐",
    patterns: ["easy", "medium", "hard", "quick", "beginner", "advanced"],
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
      "protein",
      "tofu",
      "beans",
      "lentils",
    ],
  },
  cooking: {
    name: "Cooking Method",
    color: "#FF9FF3",
    icon: "🔥",
    patterns: [
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
