import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMealPlan } from "@/context/MealPlanContext";
import { useRecipes } from "@/context/RecipeContext";
import { colors, spacing, borderRadius } from "@/utils/styleUtils";

const MEAL_TYPES = [
  { key: "breakfast", label: "Breakfast", icon: "sunny-outline" },
  { key: "lunch", label: "Lunch", icon: "partly-sunny-outline" },
  { key: "dinner", label: "Dinner", icon: "moon-outline" },
  { key: "snack", label: "Snacks", icon: "cafe-outline" },
];

interface TodaysMealPlanProps {
  onMealPress?: (mealType: string) => void;
  compact?: boolean;
}

const TodaysMealPlan: React.FC<TodaysMealPlanProps> = ({
  onMealPress,
  compact = false,
}) => {
  const { weekMeals } = useMealPlan();
  const { recipes } = useRecipes();

  const today = new Date().toISOString().split("T")[0];
  const todaysMeals = weekMeals[today] || {};

  const getRecipeById = (recipeId: string) => {
    return recipes.find((recipe) => recipe.id === recipeId);
  };

  const renderMealSection = (mealType: {
    key: string;
    label: string;
    icon: string;
  }) => {
    const meals = todaysMeals[mealType.key] || [];

    return (
      <TouchableOpacity
        key={mealType.key}
        style={[styles.mealSection, compact && styles.compactMealSection]}
        onPress={() => onMealPress?.(mealType.key)}
      >
        <View style={styles.mealHeader}>
          <View style={styles.mealHeaderLeft}>
            <Ionicons
              name={mealType.icon as any}
              size={compact ? 16 : 20}
              color={colors.primary}
            />
            <Text
              style={[styles.mealTitle, compact && styles.compactMealTitle]}
            >
              {mealType.label}
            </Text>
          </View>
          {meals.length > 0 && (
            <View style={styles.mealCount}>
              <Text style={styles.mealCountText}>{meals.length}</Text>
            </View>
          )}
        </View>

        {meals.length === 0 ? (
          <View style={styles.emptyMeal}>
            <Text style={styles.emptyMealText}>No meal planned</Text>
          </View>
        ) : (
          <View style={styles.mealsContainer}>
            {meals.slice(0, compact ? 1 : 3).map((meal, index) => {
              const recipe = getRecipeById(meal.recipe_id);
              return (
                <View key={`${meal.id}-${index}`} style={styles.mealItem}>
                  {recipe?.imageUrl && (
                    <Image
                      source={{ uri: recipe.imageUrl }}
                      style={[
                        styles.mealImage,
                        compact && styles.compactMealImage,
                      ]}
                    />
                  )}
                  <View style={styles.mealContent}>
                    <Text
                      style={[
                        styles.mealName,
                        compact && styles.compactMealName,
                      ]}
                      numberOfLines={1}
                    >
                      {recipe?.title || "Unknown Recipe"}
                    </Text>
                    {!compact && recipe?.prepTime && (
                      <Text style={styles.mealTime}>{recipe.prepTime}min</Text>
                    )}
                  </View>
                </View>
              );
            })}
            {meals.length > (compact ? 1 : 3) && (
              <Text style={styles.moreMealsText}>
                +{meals.length - (compact ? 1 : 3)} more
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <View style={styles.header}>
        <Text
          style={[styles.headerTitle, compact && styles.compactHeaderTitle]}
        >
          Today's Meals
        </Text>
        <Text style={styles.headerDate}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </Text>
      </View>

      {compact ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactMealsContainer}
        >
          {MEAL_TYPES.map(renderMealSection)}
        </ScrollView>
      ) : (
        <View style={styles.mealsGrid}>
          {MEAL_TYPES.map(renderMealSection)}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    padding: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.dark,
  },
  compactHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerDate: {
    fontSize: 14,
    color: colors.gray[500],
    fontWeight: "500",
  },
  mealsGrid: {
    gap: spacing.sm,
  },
  compactMealsContainer: {
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  mealSection: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  compactMealSection: {
    minWidth: 140,
    padding: spacing.xs,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  mealHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.dark,
    marginLeft: spacing.xs,
  },
  compactMealTitle: {
    fontSize: 12,
  },
  mealCount: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mealCountText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.white,
  },
  emptyMeal: {
    paddingVertical: spacing.xs,
  },
  emptyMealText: {
    fontSize: 12,
    color: colors.gray[400],
    fontStyle: "italic",
  },
  mealsContainer: {
    gap: spacing.xs,
  },
  mealItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  mealImage: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: colors.gray[200],
  },
  compactMealImage: {
    width: 20,
    height: 20,
    borderRadius: 3,
  },
  mealContent: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  mealName: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.dark,
  },
  compactMealName: {
    fontSize: 11,
  },
  mealTime: {
    fontSize: 10,
    color: colors.gray[500],
    marginTop: 1,
  },
  moreMealsText: {
    fontSize: 10,
    color: colors.gray[500],
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
});

export default TodaysMealPlan;
