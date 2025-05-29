import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMealPlan } from "@/context/MealPlanContext";
import { useRecipes } from "@/context/RecipeContext";
import { MealPlanItem } from "@/services/mealPlanService";
import { colors } from "@/utils/styleUtils";
import { getRecipeColor } from "@/utils/groceryUtils";
import RecipePicker from "./RecipePicker";

interface MealSlotProps {
  date: string;
  mealType: string;
  meals: MealPlanItem[];
  compact?: boolean;
}

const MealSlot: React.FC<MealSlotProps> = ({
  date,
  mealType,
  meals,
  compact = false,
}) => {
  const { addMealToDay, removeMealFromDay } = useMealPlan();
  const { recipes } = useRecipes();
  const [showRecipePicker, setShowRecipePicker] = useState(false);

  const handleAddMeal = () => {
    setShowRecipePicker(true);
  };

  const handleSelectRecipe = async (recipeId: string) => {
    try {
      await addMealToDay(date, mealType, recipeId);
      setShowRecipePicker(false);
    } catch (error) {
      console.error("Failed to add meal:", error);
      Alert.alert("Error", "Failed to add meal to plan");
    }
  };

  const handleRemoveMeal = async (recipeId: string) => {
    Alert.alert(
      "Remove Meal",
      "Are you sure you want to remove this meal from your plan?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeMealFromDay(date, mealType, recipeId);
            } catch (error) {
              console.error("Failed to remove meal:", error);
              Alert.alert("Error", "Failed to remove meal from plan");
            }
          },
        },
      ]
    );
  };

  const getRecipeById = (recipeId: string) => {
    return recipes.find((recipe) => recipe.id === recipeId);
  };

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {meals.length === 0 ? (
        <TouchableOpacity
          style={[styles.emptySlot, compact && styles.compactEmptySlot]}
          onPress={handleAddMeal}
        >
          <Ionicons
            name="add-circle-outline"
            size={compact ? 16 : 24}
            color={colors.gray[400]}
          />
          {!compact && <Text style={styles.emptyText}>Add meal</Text>}
        </TouchableOpacity>
      ) : (
        <View style={styles.mealsContainer}>
          {meals.map((meal, index) => {
            const recipe = getRecipeById(meal.recipe_id);
            const recipeColor = getRecipeColor(meal.recipe_id);

            if (compact) {
              return (
                <View
                  key={`${meal.id}-${index}`}
                  style={[
                    styles.compactMealItem,
                    { backgroundColor: recipeColor },
                  ]}
                >
                  <View style={styles.compactMealIndicator} />
                  <Text style={styles.compactMealTitle} numberOfLines={1}>
                    {recipe?.title || "Unknown Recipe"}
                  </Text>
                </View>
              );
            }

            return (
              <View
                key={`${meal.id}-${index}`}
                style={[
                  styles.mealItem,
                  { borderLeftColor: recipeColor, borderLeftWidth: 4 },
                ]}
              >
                {recipe?.imageUrl && (
                  <Image
                    source={{ uri: recipe.imageUrl }}
                    style={styles.mealImage}
                  />
                )}
                <View style={styles.mealContent}>
                  <Text style={styles.mealTitle} numberOfLines={2}>
                    {recipe?.title || "Unknown Recipe"}
                  </Text>
                  {recipe?.prepTime && (
                    <Text style={styles.mealTime}>{recipe.prepTime}min</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveMeal(meal.recipe_id)}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={colors.red[500]}
                  />
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Add another meal button - only show in non-compact mode */}
          {!compact && (
            <TouchableOpacity
              style={styles.addAnotherButton}
              onPress={handleAddMeal}
            >
              <Ionicons name="add-outline" size={16} color={colors.primary} />
              <Text style={styles.addAnotherText}>Add another</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Recipe Picker Modal */}
      <RecipePicker
        visible={showRecipePicker}
        onClose={() => setShowRecipePicker(false)}
        onSelectRecipe={handleSelectRecipe}
        mealType={mealType}
        date={date}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 120,
  },
  emptySlot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: "dashed",
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    paddingVertical: 24,
    marginVertical: 8,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.gray[500],
    fontWeight: "500",
  },
  mealsContainer: {
    flex: 1,
    paddingVertical: 8,
  },
  mealItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.gray[200],
  },
  mealContent: {
    flex: 1,
    marginLeft: 12,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.dark,
    lineHeight: 18,
    marginBottom: 2,
  },
  mealTime: {
    fontSize: 12,
    color: colors.gray[500],
  },
  removeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.red[500] + "10",
  },
  addAnotherButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    backgroundColor: colors.primary + "10",
    marginTop: 4,
  },
  addAnotherText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    marginLeft: 6,
  },
  compactContainer: {
    minHeight: 60,
  },
  compactEmptySlot: {
    minHeight: 40,
    paddingVertical: 8,
    borderWidth: 1,
    borderStyle: "solid",
  },
  compactMealItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    padding: 6,
    marginBottom: 4,
  },
  compactMealIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
    marginRight: 6,
  },
  compactMealTitle: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.white,
    flex: 1,
  },
});

export default MealSlot;
