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
import RecipePicker from "./RecipePicker";

interface MealSlotProps {
  date: string;
  mealType: string;
  meals: MealPlanItem[];
}

const MealSlot: React.FC<MealSlotProps> = ({ date, mealType, meals }) => {
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
    <View style={styles.container}>
      {meals.length === 0 ? (
        <TouchableOpacity style={styles.emptySlot} onPress={handleAddMeal}>
          <Ionicons
            name="add-circle-outline"
            size={24}
            color={colors.gray[400]}
          />
          <Text style={styles.emptyText}>Add meal</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.mealsContainer}>
          {meals.map((meal, index) => {
            const recipe = getRecipeById(meal.recipe_id);
            return (
              <View key={`${meal.id}-${index}`} style={styles.mealItem}>
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

          {/* Add another meal button */}
          <TouchableOpacity
            style={styles.addAnotherButton}
            onPress={handleAddMeal}
          >
            <Ionicons name="add-outline" size={16} color={colors.primary} />
            <Text style={styles.addAnotherText}>Add another</Text>
          </TouchableOpacity>
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
    padding: 8,
    minHeight: 80,
  },
  emptySlot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: "dashed",
    borderRadius: 8,
    backgroundColor: colors.gray[50],
  },
  emptyText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: "500",
  },
  mealsContainer: {
    flex: 1,
  },
  mealItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mealImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.gray[200],
  },
  mealContent: {
    flex: 1,
    marginLeft: 8,
  },
  mealTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.dark,
    lineHeight: 14,
  },
  mealTime: {
    fontSize: 10,
    color: colors.gray[500],
    marginTop: 2,
  },
  removeButton: {
    padding: 2,
  },
  addAnotherButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    backgroundColor: colors.primary + "10",
  },
  addAnotherText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "500",
    marginLeft: 4,
  },
});

export default MealSlot;
