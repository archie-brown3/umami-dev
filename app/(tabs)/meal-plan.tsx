import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "../../utils/styleUtils";
import { useMealPlan } from "../../context/MealPlanContext";
import WeeklyCalendar from "../../components/meal-plan/WeeklyCalendar";

export default function MealPlanTab() {
  const { currentWeek, generateShoppingList, refreshMealPlan, isLoading } =
    useMealPlan();

  useEffect(() => {
    refreshMealPlan();
  }, []);

  const handleGenerateShoppingList = async () => {
    try {
      const weekStart = currentWeek.toISOString().split("T")[0];
      const weekEnd = new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      await generateShoppingList({
        start: weekStart,
        end: weekEnd,
      });

      Alert.alert(
        "Shopping List Generated",
        "A shopping list has been created from your meal plan!",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Failed to generate shopping list:", error);
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Meal Plan",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.white,
          },
          headerTitleStyle: {
            fontSize: 24,
            fontWeight: "700",
            color: colors.dark,
          },
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleGenerateShoppingList}
                style={styles.headerButton}
              >
                <Ionicons
                  name="basket-outline"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={refreshMealPlan}
                style={styles.headerButton}
              >
                <Ionicons
                  name="refresh-outline"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <WeeklyCalendar />
    </View>
  );
}

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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});
