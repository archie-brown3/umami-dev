import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MealPlanProvider } from "@/context/MealPlanContext";
import WeeklyCalendar from "@/components/meal-plan/WeeklyCalendar";
import { colors } from "@/utils/styleUtils";

export default function MealPlanScreen() {
  return (
    <MealPlanProvider>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <WeeklyCalendar />
      </SafeAreaView>
    </MealPlanProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
});
