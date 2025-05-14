import React, { useMemo } from "react";
import { Recipe } from "../../types";
import { Card } from "../ui/card";
import { useCupboard } from "../../context/CupboardContext";
import { Badge } from "../ui/badge";
import { TouchableOpacity, Text, View, Image } from "react-native";

// Utility function to combine class names
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

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
  onPress?: () => void;
  showAvailability?: boolean;
}

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

interface CupboardItem {
  name: string;
  amount: number;
  unit: string;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onPress,
  showAvailability = true,
}) => {
  const { cupboardItems } = useCupboard();

  // Calculate ingredient availability
  const availabilityPercentage = useMemo(() => {
    if (!showAvailability) return 100;

    const totalIngredients = recipe.ingredients.length;
    if (totalIngredients === 0) return 100;

    const availableIngredients = recipe.ingredients.filter(
      (ingredient: Ingredient) =>
        cupboardItems.some(
          (item: CupboardItem) =>
            item.name.toLowerCase() === ingredient.name.toLowerCase() &&
            item.amount >= ingredient.amount
        )
    ).length;

    return Math.round((availableIngredients / totalIngredients) * 100);
  }, [recipe.ingredients, cupboardItems, showAvailability]);

  return (
    <TouchableOpacity onPress={onPress}>
      <Card>
        <View>
          <Image
            source={{ uri: recipe.imageUrl }}
            style={{
              width: "100%",
              height: 192,
              resizeMode: "cover",
            }}
          />
          {showAvailability && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: 8,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 4,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  borderRadius: 2,
                }}
              >
                <View
                  style={{
                    height: "100%",
                    width: `${availabilityPercentage}%`,
                    backgroundColor:
                      availabilityPercentage >= 80
                        ? "#8AB39F"
                        : availabilityPercentage >= 50
                        ? "#F4B942"
                        : "#E57373",
                    borderRadius: 2,
                  }}
                />
              </View>
              <Text
                style={{
                  color: "white",
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                {availabilityPercentage}% of ingredients available
              </Text>
            </View>
          )}
        </View>

        <View style={{ padding: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            {recipe.title}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
              }}
            >
              {recipe.prepTime + recipe.cookTime} mins
            </Text>
            {recipe.category && (
              <>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#6B7280",
                  }}
                >
                  •
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#6B7280",
                  }}
                >
                  {recipe.category}
                </Text>
              </>
            )}
          </View>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 12,
            }}
          >
            {recipe.tags.map((tag: string) => (
              <Badge key={tag}>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#374151",
                  }}
                >
                  {tag}
                </Text>
              </Badge>
            ))}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};
