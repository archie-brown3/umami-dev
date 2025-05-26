import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMealPlan } from "@/context/MealPlanContext";
import { getWeekDates } from "@/services/mealPlanService";
import { colors } from "@/utils/styleUtils";
import MealSlot from "./MealSlot";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

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

  const weekDates = getWeekDates(currentWeek);
  const today = new Date().toISOString().split("T")[0];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDate().toString();
  };

  const isToday = (dateString: string) => {
    return dateString === today;
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
          <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.navButton} onPress={goToNextWeek}>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleGenerateShoppingList}
        >
          <Ionicons name="basket-outline" size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Generate Shopping List</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={refreshWeek}>
          <Ionicons name="refresh-outline" size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Grid */}
      <ScrollView
        style={styles.calendarContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Days Header */}
        <View style={styles.daysHeader}>
          {DAYS_OF_WEEK.map((day, index) => (
            <View key={day} style={styles.dayHeaderContainer}>
              <Text style={styles.dayHeader}>{day}</Text>
              <Text
                style={[
                  styles.dateHeader,
                  isToday(weekDates[index]) && styles.todayDate,
                ]}
              >
                {formatDate(weekDates[index])}
              </Text>
            </View>
          ))}
        </View>

        {/* Meal Slots Grid */}
        {MEAL_TYPES.map((mealType) => (
          <View key={mealType} style={styles.mealRow}>
            <View style={styles.mealTypeHeader}>
              <Text style={styles.mealTypeText}>
                {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </Text>
            </View>

            <View style={styles.mealSlotsContainer}>
              {weekDates.map((date) => (
                <View
                  key={`${date}-${mealType}`}
                  style={styles.mealSlotContainer}
                >
                  <MealSlot
                    date={date}
                    mealType={mealType}
                    meals={weekMeals[date]?.[mealType] || []}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  navButton: {
    padding: 8,
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
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 14,
  },
  calendarContainer: {
    flex: 1,
  },
  daysHeader: {
    flexDirection: "row",
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  dayHeaderContainer: {
    flex: 1,
    alignItems: "center",
  },
  dayHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[600],
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.dark,
    marginTop: 2,
  },
  todayDate: {
    color: colors.primary,
  },
  mealRow: {
    backgroundColor: colors.white,
    marginBottom: 1,
  },
  mealTypeHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.gray[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  mealTypeText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
  },
  mealSlotsContainer: {
    flexDirection: "row",
    minHeight: 80,
  },
  mealSlotContainer: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: colors.gray[200],
  },
  retryInfo: {
    marginTop: 16,
    fontSize: 14,
    color: colors.gray[600],
    textAlign: "center",
  },
});

export default WeeklyCalendar;
