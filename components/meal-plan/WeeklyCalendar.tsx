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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMealPlan } from "@/context/MealPlanContext";
import { useGroceries } from "@/context/GroceriesContext";
import { getWeekDates } from "@/services/mealPlanService";
import { colors, spacing, borderRadius } from "@/utils/styleUtils";
import MealSlot from "./MealSlot";

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
    const animatedHeight = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      Animated.timing(animatedHeight, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }, [isExpanded]);

    const expandedHeight = animatedHeight.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 400], // Adjust based on content
    });

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
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <Animated.View
          style={[styles.expandedContent, { height: expandedHeight }]}
        >
          <View style={styles.mealTypesContainer}>
            {MEAL_TYPES.map((mealType) => {
              const mealList = meals[mealType.key] || [];

              return (
                <View key={mealType.key} style={styles.mealTypeRow}>
                  <View style={styles.mealTypeHeader}>
                    <View style={styles.mealTypeInfo}>
                      <Ionicons
                        name={mealType.icon as any}
                        size={20}
                        color={mealType.color}
                      />
                      <Text style={styles.mealTypeLabel}>{mealType.label}</Text>
                    </View>
                    <View style={styles.mealTypeActions}>
                      <Ionicons
                        name="restaurant-outline"
                        size={16}
                        color={colors.gray[400]}
                      />
                    </View>
                  </View>

                  <View style={styles.mealSlotContainer}>
                    <MealSlot
                      date={date}
                      mealType={mealType.key}
                      meals={mealList}
                      compact={true}
                    />
                  </View>
                </View>
              );
            })}

            {/* Notes Section */}
            <View style={styles.mealTypeRow}>
              <View style={styles.mealTypeHeader}>
                <View style={styles.mealTypeInfo}>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color={colors.gray[600]}
                  />
                  <Text style={styles.mealTypeLabel}>Notes</Text>
                </View>
                <View style={styles.mealTypeActions}>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.gray[400]}
                  />
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
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

  const handleGenerateShoppingList = async () => {
    try {
      setIsGeneratingShoppingList(true);

      const weekStart = currentWeek.toISOString().split("T")[0];
      const weekEnd = new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      await generateShoppingList({
        start: weekStart,
        end: weekEnd,
      });

      // Refresh the groceries context to show the new items
      await refreshShoppingList();

      Alert.alert(
        "Shopping List Generated! 🛒",
        "All ingredients from your meal plan have been added to your shopping list.",
        [
          {
            text: "View Shopping List",
            onPress: () => {
              // Navigate to groceries tab - this would need router integration
            },
          },
          { text: "OK", style: "default" },
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
      {/* Week Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={goToPreviousWeek}>
          <Ionicons name="chevron-back" size={24} color={colors.gray[600]} />
        </TouchableOpacity>

        <View style={styles.weekInfo}>
          <Text style={styles.weekText}>
            {currentWeek.toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            -{" "}
            {new Date(
              currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000
            ).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </View>

        <TouchableOpacity style={styles.navButton} onPress={goToNextWeek}>
          <Ionicons name="chevron-forward" size={24} color={colors.gray[600]} />
        </TouchableOpacity>
      </View>

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
          onPress={handleGenerateShoppingList}
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
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  expandedContent: {
    overflow: "hidden",
    backgroundColor: colors.gray[50],
  },
  mealTypesContainer: {
    padding: spacing.md,
  },
  mealTypeRow: {
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
  mealSlotContainer: {
    paddingHorizontal: spacing.sm,
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
});

export default WeeklyCalendar;
