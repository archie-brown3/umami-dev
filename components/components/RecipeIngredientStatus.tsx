import React from "react";
import {
  CheckCircle2,
  XCircle,
  ShoppingCart,
  DollarSign,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ingredient } from "../types";
import { toast } from "sonner";
import IngredientsCircleChart from "./IngredientsCircleChart";

interface RecipeIngredientStatusProps {
  ingredients: Ingredient[];
  checkIngredientInCupboard: (name: string) => boolean;
  addToShoppingList?: (ingredient: Ingredient) => void;
  recipeId?: string;
  showProgressBar?: boolean;
  showMissingButton?: boolean;
  showCost?: boolean;
  toppings?: Ingredient[];
}

// Helper function to determine the emoji for an ingredient
const getIngredientEmoji = (ingredient: Ingredient): string => {
  const name = ingredient.name.toLowerCase();
  const category = (ingredient.category || "").toLowerCase();

  // Check name first for more specific matching
  if (name.includes("chicken")) return "🍗";
  if (name.includes("beef") || name.includes("steak")) return "🥩";
  if (name.includes("pork")) return "🥓";
  if (name.includes("fish") || name.includes("salmon") || name.includes("tuna"))
    return "🐟";
  if (name.includes("shrimp") || name.includes("prawn")) return "🦐";
  if (name.includes("egg")) return "🥚";
  if (name.includes("milk") || name.includes("cream")) return "🥛";
  if (name.includes("cheese")) return "🧀";
  if (name.includes("butter")) return "🧈";
  if (name.includes("bread") || name.includes("toast")) return "🍞";
  if (name.includes("rice")) return "🍚";
  if (
    name.includes("pasta") ||
    name.includes("noodle") ||
    name.includes("spaghetti")
  )
    return "🍝";
  if (name.includes("tomato")) return "🍅";
  if (name.includes("potato")) return "🥔";
  if (name.includes("carrot")) return "🥕";
  if (name.includes("corn")) return "🌽";
  if (name.includes("lettuce") || name.includes("salad")) return "🥬";
  if (name.includes("broccoli")) return "🥦";
  if (name.includes("cucumber")) return "🥒";
  if (name.includes("pepper") || name.includes("chili")) return "🌶️";
  if (name.includes("garlic")) return "🧄";
  if (name.includes("onion")) return "🧅";
  if (name.includes("mushroom")) return "🍄";
  if (name.includes("apple")) return "🍎";
  if (name.includes("banana")) return "🍌";
  if (name.includes("orange") || name.includes("tangerine")) return "🍊";
  if (name.includes("lemon")) return "🍋";
  if (name.includes("strawberry")) return "🍓";
  if (name.includes("avocado")) return "🥑";
  if (name.includes("coconut")) return "🥥";
  if (name.includes("salt") || name.includes("pepper")) return "🧂";
  if (name.includes("oil")) return "🫗";
  if (name.includes("water")) return "💧";

  // If no name match, fall back to category
  if (category.includes("meat")) return "🥩";
  if (category.includes("seafood")) return "🐟";
  if (category.includes("vegetable")) return "🥬";
  if (category.includes("fruit")) return "🍎";
  if (category.includes("dairy")) return "🥛";
  if (category.includes("bakery")) return "🍞";
  if (category.includes("grain") || category.includes("pasta")) return "🌾";
  if (category.includes("spice")) return "🧂";
  if (category.includes("condiment")) return "🧂";

  // Default
  return "🍽️";
};

const RecipeIngredientStatus: React.FC<RecipeIngredientStatusProps> = ({
  ingredients,
  checkIngredientInCupboard,
  addToShoppingList,
  recipeId,
  showProgressBar = true,
  showMissingButton = true,
  showCost = false,
  toppings = [],
}) => {
  // Calculate availability
  const availableIngredientsCount = ingredients.filter((ingredient) =>
    checkIngredientInCupboard(ingredient.name)
  ).length;

  const ingredientAvailabilityPercentage =
    ingredients.length > 0
      ? Math.round((availableIngredientsCount / ingredients.length) * 100)
      : 0;

  // Determine readiness level based on percentage
  const getReadinessLevel = () => {
    if (ingredientAvailabilityPercentage === 100) {
      return {
        status: "Ready to Cook",
        color: "bg-[#8AB39F]",
        textColor: "text-[#8AB39F]",
      };
    } else if (ingredientAvailabilityPercentage >= 75) {
      return {
        status: "Almost Ready",
        color: "bg-[#F08C75]",
        textColor: "text-[#F08C75]",
      };
    } else if (ingredientAvailabilityPercentage >= 50) {
      return {
        status: "Halfway Ready",
        color: "bg-[#D4E4F0]",
        textColor: "text-[#637D93]",
      };
    } else {
      return {
        status: "Missing Ingredients",
        color: "bg-[#935E4C]",
        textColor: "text-[#935E4C]",
      };
    }
  };

  const readiness = getReadinessLevel();

  const handleAddMissingToShoppingList = () => {
    if (!addToShoppingList) return;

    // Only add ingredients that are not in the cupboard
    const missingIngredients = ingredients.filter(
      (ingredient) => !checkIngredientInCupboard(ingredient.name)
    );

    missingIngredients.forEach((ingredient) => {
      addToShoppingList(ingredient);
    });

    toast.success(
      `Added ${missingIngredients.length} missing ingredients to shopping list!`
    );
  };

  // Calculate total cost of ingredients if costs are available
  const totalCost = showCost
    ? ingredients.reduce((sum, ingredient) => sum + (ingredient.cost || 0), 0)
    : 0;

  // Helper function to render ingredient item
  const renderIngredientItem = (ingredient: Ingredient, index: number) => {
    const isAvailable = checkIngredientInCupboard(ingredient.name);
    const emoji = ingredient.emoji || getIngredientEmoji(ingredient);

    return (
      <li key={index} className="flex items-start py-3 px-2">
        {/* Ingredient emoji in fixed width container */}
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center mr-3 bg-gray-100 rounded-lg">
          <span className="text-xl">{emoji}</span>
        </div>

        {/* Ingredient details with measure and name */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-lg font-medium font-roboto">
              {ingredient.quantity} {ingredient.unit}
            </span>
            <span className="text-lg flex-1 font-roboto">
              {ingredient.name}
            </span>
          </div>

          {/* Optional category display instead of notes */}
          {ingredient.category && (
            <p className="text-sm text-gray-500 mt-0.5 font-roboto">
              {ingredient.category}
            </p>
          )}
        </div>

        {/* Status indicator and add button */}
        <div className="flex items-center justify-end flex-shrink-0 ml-auto">
          {isAvailable ? (
            <Badge
              variant="outline"
              className="bg-[#8AB39F]/20 text-[#8AB39F] border-[#8AB39F]/30 text-xs px-2 py-0.5"
            >
              In cupboard
            </Badge>
          ) : (
            addToShoppingList && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 rounded-full px-2"
                onClick={() => {
                  addToShoppingList(ingredient);
                  toast.success(`Added ${ingredient.name} to shopping list`);
                }}
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                <span className="text-xs">Add</span>
              </Button>
            )
          )}

          {/* Show cost if requested */}
          {showCost && ingredient.cost && ingredient.cost > 0 && (
            <div className="text-xs text-[#8AB39F] font-medium ml-2">
              ${ingredient.cost.toFixed(2)}
            </div>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="recipe-ingredient-status">
      {/* Cupboard Readiness Indicator with Circular Chart */}
      {showProgressBar && ingredients.length > 0 && (
        <div className="mb-3 flex items-center gap-2 bg-[#E8E3D7]/30 py-1.5 px-3 rounded-lg">
          {/* Circle indicator */}
          <div
            className={`w-2.5 h-2.5 rounded-full ${readiness.color} flex-shrink-0`}
          ></div>

          {/* Status Text */}
          <div className="flex-1">
            <p className="text-xs">
              <span className="font-medium">
                {availableIngredientsCount}/{ingredients.length}
              </span>{" "}
              ingredients in your cupboard
            </p>
          </div>

          {showMissingButton &&
            addToShoppingList &&
            ingredientAvailabilityPercentage < 100 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddMissingToShoppingList}
                className="flex-shrink-0 text-xs h-6 px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add missing
              </Button>
            )}
        </div>
      )}

      {/* Main Ingredients List */}
      <div className="mb-6">
        <ul className="divide-y divide-gray-100 border-y border-gray-100">
          {ingredients.map(renderIngredientItem)}
        </ul>
      </div>

      {/* Toppings Section (if provided) */}
      {toppings.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2 font-vollkorn">Toppings:</h3>
          <ul className="divide-y divide-gray-100 border-y border-gray-100">
            {toppings.map(renderIngredientItem)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RecipeIngredientStatus;
