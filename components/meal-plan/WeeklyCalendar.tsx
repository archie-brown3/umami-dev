import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMealPlan } from "@/context/MealPlanContext";
import { getWeekDates } from "@/services/mealPlanService";
import { colors, spacing, borderRadius } from "@/utils/styleUtils";
import MealSlot from "./MealSlot";

const { width: screenWidth } = Dimensions.get("window");
const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_TYPES = [
  { key: "breakfast", label: "Breakfast", icon: "sunny-outline" },
  { key: "lunch", label: "Lunch", icon: "partly-sunny-outline" },
  { key: "dinner", label: "Dinner", icon: "moon-outline" },
  { key: "snack", label: "Snacks", icon: "cafe-outline" },
];

type ViewMode = "daily" | "weekly";

const WeeklyCalendar: React.FC = () => {
  const {
    currentWeek,
    weekMeals,
    isLoading,
    error,
    goToNextWeek,
    goToPreviousWeek,
    goToToday,
    generateShoppingList,
    refreshWeek,
  } = useMealPlan();

  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    // Default to today if it's in the current week
    const today = new Date().toISOString().split("T")[0];
    const weekDates = getWeekDates(currentWeek);
    const todayIndex = weekDates.findIndex((date) => date === today);
    return todayIndex >= 0 ? todayIndex : 0;
  });

  const [collapsedMeals, setCollapsedMeals] = useState<Set<string>>(new Set());

  const weekDates = getWeekDates(currentWeek);
  const today = new Date().toISOString().split("T")[0];
  const selectedDate = weekDates[selectedDayIndex];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDate().toString();
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const isToday = (dateString: string) => {
    return dateString === today;
  };

  const toggleMealCollapse = (mealType: string) => {
    const newCollapsed = new Set(collapsedMeals);
    if (newCollapsed.has(mealType)) {
      newCollapsed.delete(mealType);
    } else {
      newCollapsed.add(mealType);
    }
    setCollapsedMeals(newCollapsed);
  };

  const handleGenerateShoppingList = async () => {
    try {
      await generateShoppingList({
        start: weekDates[0],
        end: weekDates[6],
      });
      // You might want to show a success message or navigate to groceries tab
    } catch (error) {
      console.error("Failed to generate shopping list:", error);
    }
  };

  const goToNextDay = () => {
    if (selectedDayIndex < 6) {
      setSelectedDayIndex(selectedDayIndex + 1);
    } else {
      goToNextWeek();
      setSelectedDayIndex(0);
    }
  };

  const goToPreviousDay = () => {
    if (selectedDayIndex > 0) {
      setSelectedDayIndex(selectedDayIndex - 1);
    } else {
      goToPreviousWeek();
      setSelectedDayIndex(6);
    }
  };

  const goToTodayAndSelectIt = () => {
    goToToday();
    // After going to today's week, find today's index
    const todayIndex = getWeekDates(new Date()).findIndex(
      (date) => date === today
    );
    if (todayIndex >= 0) {
      setSelectedDayIndex(todayIndex);
    }
  };

  // Render weekly grid view
  const renderWeeklyView = () => {
    return (
      <ScrollView
        style={styles.weeklyContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Days header */}
        <View style={styles.weeklyHeader}>
          <View style={styles.mealTypeHeaderCell} />
          {DAYS_OF_WEEK.map((day, index) => (
            <View key={day} style={styles.dayHeaderCell}>
              <Text
                style={[
                  styles.dayHeaderText,
                  isToday(weekDates[index]) && styles.todayHeaderText,
                ]}
              >
                {day}
              </Text>
              <Text
                style={[
                  styles.dayHeaderDate,
                  isToday(weekDates[index]) && styles.todayHeaderDate,
                ]}
              >
                {formatDate(weekDates[index])}
              </Text>
            </View>
          ))}
        </View>

        {/* Meal rows */}
        {MEAL_TYPES.map((mealType) => (
          <View key={mealType.key} style={styles.weeklyRow}>
            <View style={styles.mealTypeCell}>
              <Ionicons
                name={mealType.icon as any}
                size={16}
                color={colors.primary}
                style={styles.mealTypeIcon}
              />
              <Text style={styles.mealTypeText}>{mealType.label}</Text>
            </View>
            {weekDates.map((date) => {
              const meals = weekMeals[date]?.[mealType.key] || [];
              return (
                <View
                  key={`${date}-${mealType.key}`}
                  style={styles.weeklyMealCell}
                >
                  <MealSlot
                    date={date}
                    mealType={mealType.key}
                    meals={meals}
                    compact={true}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    );
  };

  // Render daily view (existing implementation)
  const renderDailyView = () => {
    return (
      <>
        {/* Day Selector */}
        <View style={styles.daySelector}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daySelectorContent}
          >
            {DAYS_OF_WEEK.map((day, index) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayTab,
                  selectedDayIndex === index && styles.selectedDayTab,
                  isToday(weekDates[index]) && styles.todayTab,
                ]}
                onPress={() => setSelectedDayIndex(index)}
              >
                <Text
                  style={[
                    styles.dayTabText,
                    selectedDayIndex === index && styles.selectedDayTabText,
                    isToday(weekDates[index]) && styles.todayTabText,
                  ]}
                >
                  {day}
                </Text>
                <Text
                  style={[
                    styles.dayTabDate,
                    selectedDayIndex === index && styles.selectedDayTabDate,
                    isToday(weekDates[index]) && styles.todayTabDate,
                  ]}
                >
                  {formatDate(weekDates[index])}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Selected Day Content */}
        <View style={styles.dayContent}>
          {/* Day Navigation */}
          <View style={styles.dayNavigation}>
            <TouchableOpacity
              style={styles.dayNavButton}
              onPress={goToPreviousDay}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={colors.gray[600]}
              />
            </TouchableOpacity>

            <Text style={styles.selectedDayTitle}>
              {formatFullDate(selectedDate)}
            </Text>

            <TouchableOpacity style={styles.dayNavButton} onPress={goToNextDay}>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.gray[600]}
              />
            </TouchableOpacity>
          </View>

          {/* Meals for Selected Day */}
          <ScrollView
            style={styles.mealsContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.mealsContent}
          >
            {MEAL_TYPES.map((mealType) => {
              const isCollapsed = collapsedMeals.has(mealType.key);
              const meals = weekMeals[selectedDate]?.[mealType.key] || [];

              return (
                <View key={mealType.key} style={styles.mealSection}>
                  <TouchableOpacity
                    style={styles.mealSectionHeader}
                    onPress={() => toggleMealCollapse(mealType.key)}
                  >
                    <View style={styles.mealSectionHeaderLeft}>
                      <Ionicons
                        name={mealType.icon as any}
                        size={20}
                        color={colors.primary}
                      />
                      <Text style={styles.mealSectionTitle}>
                        {mealType.label}
                      </Text>
                      {meals.length > 0 && (
                        <View style={styles.mealCount}>
                          <Text style={styles.mealCountText}>
                            {meals.length}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Ionicons
                      name={isCollapsed ? "chevron-down" : "chevron-up"}
                      size={20}
                      color={colors.gray[500]}
                    />
                  </TouchableOpacity>

                  {!isCollapsed && (
                    <View style={styles.mealSectionContent}>
                      <MealSlot
                        date={selectedDate}
                        mealType={mealType.key}
                        meals={meals}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {error && error.toLowerCase().includes("network")
            ? "Retrying connection..."
            : "Loading meal plan..."}
        </Text>
        {error && error.toLowerCase().includes("network") && (
          <Text style={styles.retryInfo}>
            The app will automatically retry if the connection fails
          </Text>
        )}
      </View>
    );
  }

  if (error) {
    const isNetworkError =
      error.toLowerCase().includes("network") ||
      error.toLowerCase().includes("connection");

    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name={isNetworkError ? "wifi-outline" : "alert-circle-outline"}
          size={48}
          color={colors.red[500]}
        />
        <Text style={styles.errorTitle}>
          {isNetworkError ? "Connection Problem" : "Error"}
        </Text>
        <Text style={styles.errorText}>{error}</Text>

        {isNetworkError && (
          <Text style={styles.errorHint}>
            • Check your internet connection{"\n"}• Try switching between WiFi
            and mobile data{"\n"}• The app will automatically retry
          </Text>
        )}

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
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.weekInfo}>
          <Text style={styles.weekText}>
            {currentWeek.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            -{" "}
            {new Date(
              currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000
            ).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
          <TouchableOpacity
            style={styles.todayButton}
            onPress={goToTodayAndSelectIt}
          >
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.navButton} onPress={goToNextWeek}>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* View Mode Slider */}
      <View style={styles.viewModeContainer}>
        <View style={styles.viewModeSlider}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === "daily" && styles.activeViewModeButton,
            ]}
            onPress={() => setViewMode("daily")}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={viewMode === "daily" ? colors.white : colors.gray[600]}
            />
            <Text
              style={[
                styles.viewModeText,
                viewMode === "daily" && styles.activeViewModeText,
              ]}
            >
              Daily
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === "weekly" && styles.activeViewModeButton,
            ]}
            onPress={() => setViewMode("weekly")}
          >
            <Ionicons
              name="grid-outline"
              size={16}
              color={viewMode === "weekly" ? colors.white : colors.gray[600]}
            />
            <Text
              style={[
                styles.viewModeText,
                viewMode === "weekly" && styles.activeViewModeText,
              ]}
            >
              Weekly
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content based on view mode */}
      {viewMode === "daily" ? renderDailyView() : renderWeeklyView()}

      {/* Floating Action Buttons */}
      <View style={styles.floatingActions}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={handleGenerateShoppingList}
        >
          <Ionicons name="basket-outline" size={24} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.floatingButton, styles.refreshButton]}
          onPress={refreshWeek}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.white} />
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
  errorHint: {
    marginTop: 16,
    fontSize: 14,
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark,
  },
  todayButton: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  todayButtonText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: "500",
  },
  daySelector: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  daySelectorContent: {
    paddingHorizontal: spacing.sm,
  },
  dayTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: "center",
    minWidth: 60,
  },
  selectedDayTab: {
    backgroundColor: colors.primary,
  },
  todayTab: {
    backgroundColor: colors.blue[50],
    borderWidth: 1,
    borderColor: colors.blue[500],
  },
  dayTabText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.gray[600],
  },
  selectedDayTabText: {
    color: colors.white,
    fontWeight: "600",
  },
  todayTabText: {
    color: colors.blue[600],
    fontWeight: "600",
  },
  dayTabDate: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.dark,
    marginTop: 2,
  },
  selectedDayTabDate: {
    color: colors.white,
  },
  todayTabDate: {
    color: colors.blue[600],
  },
  dayContent: {
    flex: 1,
  },
  dayNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  dayNavButton: {
    padding: spacing.xs,
  },
  selectedDayTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
    textAlign: "center",
    flex: 1,
  },
  mealsContainer: {
    flex: 1,
  },
  mealsContent: {
    padding: spacing.md,
    paddingBottom: 100, // Space for floating buttons
  },
  mealSection: {
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
  mealSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  mealSectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  mealSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
    marginLeft: spacing.sm,
  },
  mealCount: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  mealCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  mealSectionContent: {
    padding: spacing.sm,
  },
  floatingActions: {
    position: "absolute",
    bottom: spacing.lg,
    right: spacing.md,
    alignItems: "center",
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[600],
  },
  retryInfo: {
    marginTop: 16,
    fontSize: 14,
    color: colors.gray[600],
    textAlign: "center",
  },
  viewModeContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    alignItems: "center",
  },
  viewModeSlider: {
    flexDirection: "row",
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 4,
  },
  viewModeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    gap: 6,
  },
  activeViewModeButton: {
    backgroundColor: colors.primary,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[600],
  },
  activeViewModeText: {
    color: colors.white,
  },
  weeklyContainer: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  weeklyHeader: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    paddingVertical: spacing.sm,
  },
  mealTypeHeaderCell: {
    width: 100,
    paddingHorizontal: spacing.sm,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: 2,
  },
  dayHeaderDate: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.dark,
  },
  todayHeaderText: {
    color: colors.blue[600],
  },
  todayHeaderDate: {
    color: colors.blue[600],
  },
  weeklyRow: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    minHeight: 80,
  },
  mealTypeCell: {
    width: 100,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.gray[50],
  },
  mealTypeIcon: {
    marginRight: spacing.xs,
  },
  mealTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.dark,
  },
  weeklyMealCell: {
    flex: 1,
    padding: spacing.xs,
  },
});

export default WeeklyCalendar;
