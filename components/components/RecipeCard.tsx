import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Recipe } from "../types";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCupboard } from "../context/CupboardContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import "./RecipeCard.css";

// Define tag categories and color mappings
const TAG_CATEGORIES = {
  CUISINE: [
    "italian",
    "mexican",
    "chinese",
    "indian",
    "thai",
    "french",
    "japanese",
    "mediterranean",
    "american",
    "greek",
  ],
  DIFFICULTY: ["easy", "medium", "hard", "beginner", "advanced"],
  METHOD: [
    "baked",
    "fried",
    "grilled",
    "steamed",
    "boiled",
    "roasted",
    "stir-fried",
    "slow-cooked",
  ],
  DIETARY: [
    "vegetarian",
    "vegan",
    "gluten-free",
    "dairy-free",
    "low-carb",
    "keto",
    "paleo",
    "nut-free",
  ],
};

// Function to determine tag category
function getTagCategory(tag: string): string {
  const lowerTag = tag.toLowerCase();

  if (TAG_CATEGORIES.CUISINE.includes(lowerTag)) return "CUISINE";
  if (TAG_CATEGORIES.DIFFICULTY.includes(lowerTag)) return "DIFFICULTY";
  if (TAG_CATEGORIES.METHOD.includes(lowerTag)) return "METHOD";
  if (TAG_CATEGORIES.DIETARY.includes(lowerTag)) return "DIETARY";

  return "DEFAULT";
}

// Function to get tag style based on category
function getTagStyle(tag: string): string {
  const category = getTagCategory(tag);

  switch (category) {
    case "CUISINE":
      return "bg-blue-50 text-blue-600";
    case "DIETARY":
      return "bg-purple-50 text-purple-600";
    case "DIFFICULTY":
      return "bg-amber-50 text-amber-600";
    case "METHOD":
      return "bg-green-50 text-green-700";
    default:
      return "bg-gray-50 text-gray-600";
  }
}

interface RecipeCardProps {
  recipe: Recipe;
  className?: string;
  selectedTag?: string;
  onMouseEnter?: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  className,
  selectedTag = "",
  onMouseEnter,
}) => {
  const { cupboardItems } = useCupboard();

  // Check if the recipe is ready to cook (all ingredients available)
  const checkIngredientInCupboard = (ingredientName: string) => {
    return cupboardItems.some(
      (item) =>
        item.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
        ingredientName.toLowerCase().includes(item.name.toLowerCase())
    );
  };

  const availableIngredientsCount = recipe.ingredients.filter((ingredient) =>
    checkIngredientInCupboard(ingredient.name)
  ).length;

  const availabilityPercentage =
    recipe.ingredients.length > 0
      ? Math.round(
          (availableIngredientsCount / recipe.ingredients.length) * 100
        )
      : 0;

  // Get appropriate status text based on availability percentage
  const getAvailabilityStatusText = useMemo(() => {
    if (availabilityPercentage === 100) return "All ingredients available";
    if (availabilityPercentage >= 75) return "Most ingredients available";
    if (availabilityPercentage >= 50) return "Some ingredients available";
    if (availabilityPercentage > 0) return "Few ingredients available";
    return "No ingredients available";
  }, [availabilityPercentage]);

  // Select up to 3 tags to display, prioritizing the selected tag if it exists
  const getDisplayTags = () => {
    // Create a new array with unique ids to avoid duplicate keys
    const tagsWithIds = recipe.tags.map((tag, index) => ({
      id: `${recipe.id}-tag-${index}`,
      text: tag,
    }));

    // Limit to 3 tags max
    if (tagsWithIds.length <= 3) return tagsWithIds;

    // If there's a selected tag and the recipe has it, ensure it's included
    if (selectedTag && selectedTag !== "All" && selectedTag !== "Favorites") {
      const lowerSelectedTag = selectedTag.toLowerCase();
      const hasSelectedTag = tagsWithIds.some(
        (tag) => tag.text.toLowerCase() === lowerSelectedTag
      );

      if (hasSelectedTag) {
        // Find the selected tag in the recipe tags
        const selectedTagFromRecipe = tagsWithIds.find(
          (tag) => tag.text.toLowerCase() === lowerSelectedTag
        );

        // Get up to 2 other tags
        const otherTags = tagsWithIds
          .filter((tag) => tag.text.toLowerCase() !== lowerSelectedTag)
          .slice(0, 2);

        return [selectedTagFromRecipe, ...otherTags];
      }
    }

    // Otherwise just take the first 3 tags
    return tagsWithIds.slice(0, 3);
  };

  const displayTags = getDisplayTags();

  return (
    <div className="h-[280px]">
      <Card
        className="recipe-card flex h-full flex-col overflow-hidden hover:shadow-xl dark:bg-zinc-950"
        onMouseEnter={onMouseEnter}
      >
        <div className="recipe-card-image-container">
          <Link
            to={`/recipes/${recipe.id}`}
            className="block h-full"
            aria-label={`View recipe for ${recipe.title}`}
          >
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="recipe-card-image"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  recipe.title
                )}&size=100&background=random`;
              }}
            />
            <div className="absolute inset-0 flex items-start justify-between p-2">
              <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-white text-xs flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>{recipe.prepTime + recipe.cookTime} min</span>
              </div>

              {recipe.favorite && (
                <div
                  className="bg-[#F08C75] rounded-full w-4 h-4 flex items-center justify-center shadow-md"
                  title="Favorite recipe"
                  aria-label="Favorite recipe"
                >
                  <span className="text-white text-[8px]">★</span>
                </div>
              )}
            </div>

            {recipe.ingredients.length > 0 && (
              <div className="recipe-card-availability">
                <div className="recipe-card-availability-tooltip">
                  {getAvailabilityStatusText}
                </div>
                <div className="flex items-center space-x-1">
                  <div className="flex-1 recipe-card-availability-bar">
                    <div
                      className={cn(
                        "recipe-card-availability-progress",
                        availabilityPercentage >= 80
                          ? "bg-[#8AB39F]"
                          : availabilityPercentage >= 50
                          ? "bg-[#F08C75]"
                          : "bg-[#935E4C]"
                      )}
                      style={{ width: `${availabilityPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-white font-medium">
                    {availabilityPercentage}%
                  </span>
                </div>
              </div>
            )}
          </Link>
        </div>
        <div className="recipe-card-content">
          <Link
            to={`/recipes/${recipe.id}`}
            aria-label={`View recipe for ${recipe.title}`}
          >
            <h3 className="recipe-card-title" title={recipe.title}>
              {recipe.title}
            </h3>
          </Link>
          <div className="recipe-card-footer">
            <div className="recipe-card-meta">
              <span className="text-xs opacity-70">
                {recipe.ingredients.length} ingredients
              </span>
              {recipe.category && (
                <span className="text-xs opacity-70">{recipe.category}</span>
              )}
            </div>

            {displayTags && displayTags.length > 0 && (
              <div className="recipe-card-tags">
                {displayTags.map(
                  (tag, index) =>
                    index < 3 && (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className={`recipe-card-tag ${getTagStyle(tag.text)}`}
                      >
                        {tag.text}
                      </Badge>
                    )
                )}
                {recipe.tags.length > 3 && (
                  <Badge variant="secondary" className="recipe-card-tag">
                    +{recipe.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RecipeCard;
