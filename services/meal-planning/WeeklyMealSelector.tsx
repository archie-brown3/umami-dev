import React, { useEffect } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { useRecipes } from "../../context/RecipeContext";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../utils/styleUtils";

interface WeeklyMealSelectorProps {
  recipeId: string;
  currentDate: Date;
  onSlotSelect: (dayString: string, mealType: string) => void;
}

export default function WeeklyMealSelector({
  recipeId,
  currentDate,
  onSlotSelect,
}: WeeklyMealSelectorProps) {
  const { mealPlan, getRecipeById } = useRecipes();

  // For debugging - log mealPlan contents
  useEffect(() => {
    console.log("Meal Plan Data:", mealPlan);
    console.log("Current Date:", format(currentDate, "yyyy-MM-dd"));
    if (mealPlan.dayMeals) {
      console.log("Days in meal plan:", Object.keys(mealPlan.dayMeals));
    }
  }, [mealPlan, currentDate]);

  // Calculate start of the current week (Sunday)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });

  // Generate an array of weekdays
  const weekdays = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return {
      date,
      dayString: format(date, "yyyy-MM-dd"),
      shortName: format(date, "EEE"),
      fullName: format(date, "EEEE"),
      dayNumber: format(date, "d"),
      month: format(date, "MMM"),
      isToday: format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
    };
  });

  const mealTypes = ["breakfast", "lunch", "dinner", "snacks"];

  // Component for an empty meal slot
  function EmptyMealSlot({ day, mealType }: { day: string; mealType: string }) {
    return (
      <TouchableOpacity
        style={styles.emptySlot}
        onPress={() => onSlotSelect(day, mealType)}
      >
        <Ionicons name="add" size={20} color="#64748b" />
      </TouchableOpacity>
    );
  }

  // Component for an occupied meal slot
  function OccupiedMealSlot({
    day,
    mealType,
    recipeIds,
  }: {
    day: string;
    mealType: string;
    recipeIds: string[];
  }) {
    const recipesCount = recipeIds.length;

    // Get the first recipe title to display (if any)
    const firstRecipe =
      recipeIds.length > 0 ? getRecipeById(recipeIds[0]) : null;

    return (
      <TouchableOpacity
        style={styles.occupiedSlot}
        onPress={() => onSlotSelect(day, mealType)}
      >
        {recipesCount === 1 && firstRecipe ? (
          <Text
            style={styles.recipeName}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {firstRecipe.name}
          </Text>
        ) : (
          <View>
            <Text style={styles.recipesCount}>{recipesCount} recipes</Text>
            <Text style={styles.addAnother}>Add another</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Day headers */}
      <View style={styles.headerRow}>
        <View style={styles.emptyHeader}></View>
        {weekdays.map((day) => (
          <View
            key={day.dayString}
            style={[styles.dayHeader, day.isToday && styles.todayHeader]}
          >
            <Text style={styles.dayName}>{day.shortName}</Text>
            <Text style={styles.dayNumber}>{day.dayNumber}</Text>
            <Text style={styles.monthName}>{day.month}</Text>
          </View>
        ))}
      </View>

      {/* Meal type rows */}
      {mealTypes.map((mealType) => (
        <View key={mealType} style={styles.mealRow}>
          <View style={styles.mealTypeCell}>
            <Text style={styles.mealTypeName}>{mealType}</Text>
          </View>

          {weekdays.map((day) => {
            // Get meal data for this day and meal type
            const dayMeals = mealPlan?.dayMeals?.[day.dayString] || {};

            // Get recipes for this meal type or empty array if none
            const mealRecipes =
              dayMeals[mealType as keyof typeof dayMeals] || [];

            // Ensure we're working with an array
            const recipeArray = Array.isArray(mealRecipes) ? mealRecipes : [];

            return (
              <View
                key={`${day.dayString}-${mealType}`}
                style={styles.mealCell}
              >
                {recipeArray.length > 0 ? (
                  <OccupiedMealSlot
                    day={day.dayString}
                    mealType={mealType}
                    recipeIds={recipeArray}
                  />
                ) : (
                  <EmptyMealSlot day={day.dayString} mealType={mealType} />
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    gap: 8,
  },
  emptyHeader: {
    width: 80,
  },
  dayHeader: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
  },
  todayHeader: {
    backgroundColor: "rgba(79, 70, 229, 0.1)",
  },
  dayName: {
    fontSize: 12,
    fontWeight: "500",
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: "bold",
  },
  monthName: {
    fontSize: 12,
    color: "#64748b",
  },
  mealRow: {
    flexDirection: "row",
    gap: 8,
  },
  mealTypeCell: {
    width: 80,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 8,
  },
  mealTypeName: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  mealCell: {
    flex: 1,
    height: 56,
  },
  emptySlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(100, 116, 139, 0.4)",
    borderRadius: 8,
  },
  occupiedSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    backgroundColor: "rgba(79, 70, 229, 0.05)",
  },
  recipeName: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
  },
  recipesCount: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  addAnother: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "center",
  },
});
