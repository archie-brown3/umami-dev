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
  const { refreshMealPlan, isLoading } = useMealPlan();

  useEffect(() => {
    refreshMealPlan();
  }, []);

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
          title: "My Meal Plan",
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
                onPress={refreshMealPlan}
                style={styles.headerButton}
              >
                <Ionicons
                  name="refresh-outline"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons
                  name="ellipsis-horizontal"
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
