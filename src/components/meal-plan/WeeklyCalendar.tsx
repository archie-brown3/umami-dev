import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMealPlan } from "@/context/MealPlanContext";
import { useGroceries } from "@/context/GroceriesContext";
import { useRecipes } from "@/context/RecipeContext";
import { getWeekDates, MealPlanItem } from "@/services/mealPlanService";
import { colors, spacing, borderRadius } from "@/utils/styleUtils";
import MealSlot from "./MealSlot";
import { RecipeCard } from "../recipes/RecipeCard";
import { router } from "expo-router";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const MEAL_TYPES = [
  {
    key: "breakfast",
    label: "Breakfast",
    icon: "sunny-outline",
    color: "#FF9500",
  },
  {
    key: "lunch",
    label: "Lunch",
    icon: "partly-sunny-outline",
    color: "#34C759",
  },
  { key: "dinner", label: "Dinner", icon: "moon-outline", color: "#5856D6" },
  { key: "snack", label: "Snacks", icon: "gift-outline", color: "#FF3B30" },
];

interface DayCardProps {
  date: string;
  dayName: string;
  dayNumber: string;
  isToday: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  meals: any;
}

const DayCard: React.FC<DayCardProps> = React.memo(
  ({
    date,
    dayName,
    dayNumber,
    isToday,
    isExpanded,
    onToggleExpand,
    meals,
  }) => {
    const { recipes } = useRecipes();

    const getTotalMeals = () => {
      return MEAL_TYPES.reduce((total, mealType) => {
        return total + (meals[mealType.key]?.length || 0);
      }, 0);
    };

    const formatDayHeader = () => {
      const parts = dayName.split(" ");
      return parts[0]; // Just the day name
    };

    const formatDayNumber = () => {
      return dayNumber.replace(/\D/g, ""); // Extract just the number
    };

    const getRecipeById = (recipeId: string) => {
      return recipes.find((recipe) => recipe.id === recipeId);
    };

    const handleRecipePress = (recipeId: string) => {
      router.push(`/recipe/${recipeId}`);
    };

    return (
      <View style={[styles.dayCard, isToday && styles.todayCard]}>
        <TouchableOpacity
          style={styles.dayHeader}
          onPress={onToggleExpand}
          activeOpacity={0.7}
        >
          <View style={styles.dayHeaderLeft}>
            <Text style={[styles.dayName, isToday && styles.todayText]}>
              {formatDayHeader()}
            </Text>
            <Text style={[styles.dayNumber, isToday && styles.todayText]}>
              {formatDayNumber()}
            </Text>
          </View>

          <View style={styles.dayHeaderRight}>
            {getTotalMeals() > 0 && (
              <View style={styles.mealCountBadge}>
                <Text style={styles.mealCountText}>{getTotalMeals()}</Text>
              </View>
            )}
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.gray[400]}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.mealTypesContainer}>
              {MEAL_TYPES.map((mealType) => {
                const mealList = meals[mealType.key] || [];

                return (
                  <View key={mealType.key} style={styles.mealTypeSection}>
                    <View style={styles.mealTypeHeader}>
                      <View style={styles.mealTypeInfo}>
                        <Ionicons
                          name={mealType.icon as any}
                          size={20}
                          color={mealType.color}
                        />
                        <Text style={styles.mealTypeLabel}>
                          {mealType.label}
                        </Text>
                      </View>
                      <View style={styles.mealTypeActions}>
                        <Text style={styles.mealCount}>
                          {mealList.length} meal
                          {mealList.length !== 1 ? "s" : ""}
                        </Text>
                      </View>
                    </View>

                    {mealList.length === 0 ? (
                      <View style={styles.emptyMealSlot}>
                        <MealSlot
                          date={date}
                          mealType={mealType.key}
                          meals={mealList}
                          compact={false}
                        />
                      </View>
                    ) : (
                      <View style={styles.recipeCardsContainer}>
                        {mealList.map((meal: MealPlanItem, index: number) => {
                          const recipe = getRecipeById(meal.recipe_id);
                          if (!recipe) return null;

                          return (
                            <View
                              key={`${meal.id}-${index}`}
                              style={styles.recipeCardWrapper}
                            >
                              <RecipeCard
                                recipe={recipe}
                                onPress={() => handleRecipePress(recipe.id)}
                              />
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  }
);

const WeeklyCalendar: React.FC = () => {
  const {
    currentWeek,
    weekMeals,
    isLoading,
    error,
    goToNextWeek,
    goToPreviousWeek,
    goToToday,
    refreshWeek,
    generateShoppingList,
  } = useMealPlan();

  const { refreshShoppingList } = useGroceries();

  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [isGeneratingShoppingList, setIsGeneratingShoppingList] =
    useState(false);
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);
  const [shoppingListOptions, setShoppingListOptions] = useState({
    consolidateSimilar: true,
    excludePantryItems: false,
    addToExistingList: true,
  });

  const weekDates = getWeekDates(currentWeek);
  const today = new Date().toISOString().split("T")[0];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDate().toString();
  };

  const formatDayName = (dateString: string, index: number) => {
    const date = new Date(dateString);
    return `${DAYS_OF_WEEK[index]} ${date.getDate()}${getDaySuffix(
      date.getDate()
    )}`;
  };

  const getDaySuffix = (day: number) => {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const isToday = (dateString: string) => {
    return dateString === today;
  };

  const toggleDayExpansion = useCallback((date: string) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  }, []);

  const handleGenerateShoppingList = async (
    options?: typeof shoppingListOptions
  ) => {
    try {
      setIsGeneratingShoppingList(true);
      setShowShoppingListModal(false);

      const weekStart = currentWeek.toISOString().split("T")[0];
      const weekEnd = new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      // Count total recipes for better user feedback
      const totalRecipes = Object.values(weekMeals).reduce(
        (total, dayMeals) => {
          return (
            total +
            Object.values(dayMeals).reduce((dayTotal, mealList) => {
              return dayTotal + mealList.length;
            }, 0)
          );
        },
        0
      );

      if (totalRecipes === 0) {
        Alert.alert(
          "No Recipes Found",
          "Add some recipes to your meal plan first to generate a shopping list.",
          [{ text: "OK" }]
        );
        return;
      }

      await generateShoppingList(
        {
          start: weekStart,
          end: weekEnd,
        },
        options
      );

      // Refresh the groceries context to show the new items
      await refreshShoppingList();

      Alert.alert(
        "Shopping List Generated! 🛒",
        `Added ingredients from ${totalRecipes} recipes to your shopping list.`,
        [
          {
            text: "View Shopping List",
            onPress: () => {
              router.push("/(tabs)/groceries");
            },
            style: "default",
          },
          { text: "Continue Planning", style: "cancel" },
        ]
      );
    } catch (error) {
      console.error("Failed to generate shopping list:", error);
      Alert.alert(
        "Error",
        "Failed to generate shopping list. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsGeneratingShoppingList(false);
    }
  };

  const openShoppingListModal = () => {
    const totalRecipes = Object.values(weekMeals).reduce((total, dayMeals) => {
      return (
        total +
        Object.values(dayMeals).reduce((dayTotal, mealList) => {
          return dayTotal + mealList.length;
        }, 0)
      );
    }, 0);

    if (totalRecipes === 0) {
      Alert.alert(
        "No Recipes Found",
        "Add some recipes to your meal plan first to generate a shopping list.",
        [{ text: "OK" }]
      );
      return;
    }

    setShowShoppingListModal(true);
  };

  const renderShoppingListModal = () => (
    <Modal
      visible={showShoppingListModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowShoppingListModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Generate Shopping List</Text>
            <TouchableOpacity
              onPress={() => setShowShoppingListModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalDescription}>
              Create a shopping list from your meal plan for this week.
            </Text>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() =>
                  setShoppingListOptions((prev) => ({
                    ...prev,
                    consolidateSimilar: !prev.consolidateSimilar,
                  }))
                }
              >
                <View style={styles.optionLeft}>
                  <Ionicons
                    name="layers-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>
                      Consolidate Similar Items
                    </Text>
                    <Text style={styles.optionSubtitle}>
                      Combine similar ingredients (e.g., "2 onions" + "1 onion"
                      = "3 onions")
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={
                    shoppingListOptions.consolidateSimilar
                      ? "checkbox"
                      : "square-outline"
                  }
                  size={24}
                  color={
                    shoppingListOptions.consolidateSimilar
                      ? colors.primary
                      : colors.gray[400]
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionRow}
                onPress={() =>
                  setShoppingListOptions((prev) => ({
                    ...prev,
                    addToExistingList: !prev.addToExistingList,
                  }))
                }
              >
                <View style={styles.optionLeft}>
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Add to Existing List</Text>
                    <Text style={styles.optionSubtitle}>
                      Add items to your current shopping list instead of
                      creating a new one
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={
                    shoppingListOptions.addToExistingList
                      ? "checkbox"
                      : "square-outline"
                  }
                  size={24}
                  color={
                    shoppingListOptions.addToExistingList
                      ? colors.primary
                      : colors.gray[400]
                  }
                />
              </TouchableOpacity>
            </View>

            <View style={styles.recipePreview}>
              <Text style={styles.previewTitle}>Recipes in this week:</Text>
              <ScrollView
                style={styles.recipeList}
                showsVerticalScrollIndicator={false}
              >
                {Object.entries(weekMeals).map(([date, dayMeals]) => {
                  const dayRecipes = Object.values(dayMeals).flat();
                  if (dayRecipes.length === 0) return null;

                  return (
                    <View key={date} style={styles.dayPreview}>
                      <Text style={styles.dayPreviewTitle}>
                        {new Date(date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                      <Text style={styles.dayPreviewCount}>
                        {dayRecipes.length} recipe
                        {dayRecipes.length !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Ionicons
                    name="restaurant-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.statText}>
                    {Object.values(weekMeals).reduce((total, dayMeals) => {
                      return (
                        total +
                        Object.values(dayMeals).reduce((dayTotal, mealList) => {
                          return dayTotal + mealList.length;
                        }, 0)
                      );
                    }, 0)}{" "}
                    total recipes
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons
                    name="basket-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.statText}>
                    Estimated 20-40 ingredients
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowShoppingListModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={() => handleGenerateShoppingList(shoppingListOptions)}
            >
              <Ionicons name="basket-outline" size={20} color={colors.white} />
              <Text style={styles.generateButtonText}>Generate List</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading meal plan...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={colors.red[500]}
        />
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshWeek}>
          <Ionicons name="refresh-outline" size={20} color={colors.white} />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Days List */}
      <ScrollView
        style={styles.daysContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.daysContent}
      >
        {weekDates.map((date, index) => (
          <DayCard
            key={date}
            date={date}
            dayName={formatDayName(date, index)}
            dayNumber={formatDate(date)}
            isToday={isToday(date)}
            isExpanded={expandedDays.has(date)}
            onToggleExpand={() => toggleDayExpansion(date)}
            meals={weekMeals[date] || {}}
          />
        ))}
      </ScrollView>

      {/* Shopping List Generation Button */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[
            styles.shoppingListButton,
            isGeneratingShoppingList && styles.disabledButton,
          ]}
          onPress={openShoppingListModal}
          disabled={isGeneratingShoppingList}
          activeOpacity={0.8}
        >
          {isGeneratingShoppingList ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="basket-outline" size={20} color={colors.white} />
          )}
          <Text style={styles.shoppingListButtonText}>
            {isGeneratingShoppingList
              ? "Generating..."
              : "Generate Shopping List"}
          </Text>
        </TouchableOpacity>
      </View>

      {renderShoppingListModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.gray[50],
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.gray[50],
    padding: 20,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark,
    textAlign: "center",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray[600],
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  navButton: {
    padding: spacing.xs,
  },
  weekInfo: {
    alignItems: "center",
  },
  weekText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
  },
  daysContainer: {
    flex: 1,
  },
  daysContent: {
    padding: spacing.md,
    paddingBottom: 100, // Space for bottom button
  },
  dayCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  dayHeaderLeft: {
    flex: 1,
  },
  dayName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 14,
    color: colors.gray[600],
  },
  todayText: {
    color: colors.primary,
  },
  dayHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  mealCountBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: "center",
  },
  mealCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  expandedContent: {
    overflow: "hidden",
    backgroundColor: colors.gray[50],
  },
  mealTypesContainer: {
    padding: spacing.md,
  },
  mealTypeSection: {
    marginBottom: spacing.md,
  },
  mealTypeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  mealTypeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  mealTypeLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.dark,
  },
  mealTypeActions: {
    opacity: 0.6,
  },
  mealCount: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[600],
  },
  emptyMealSlot: {
    padding: spacing.md,
  },
  recipeCardsContainer: {
    padding: spacing.md,
  },
  recipeCardWrapper: {
    marginBottom: spacing.md,
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  shoppingListButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  shoppingListButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    width: "80%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalBody: {
    flex: 1,
  },
  modalDescription: {
    fontSize: 16,
    color: colors.gray[600],
    marginBottom: spacing.md,
  },
  optionsContainer: {
    marginBottom: spacing.lg,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 18,
  },
  recipePreview: {
    marginBottom: spacing.lg,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  recipeList: {
    maxHeight: 120,
  },
  dayPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.sm,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  dayPreviewTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.dark,
  },
  dayPreviewCount: {
    fontSize: 12,
    color: colors.gray[600],
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.gray[200],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray[700],
  },
  generateButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statText: {
    fontSize: 14,
    color: colors.gray[600],
  },
});

export default WeeklyCalendar;
