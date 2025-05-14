import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import EmptyState from "../components/ui/EmptyState";
import { colors } from "../utils/styleUtils";

export default function MealPlanScreen() {
  // In a real app, this would come from context
  const hasMealPlan = false;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meal Plan</Text>
      </View>

      <View style={styles.content}>
        {hasMealPlan ? (
          <Text>Meal planning content will appear here</Text>
        ) : (
          <EmptyState
            title="No Meal Plan Yet"
            message="Plan your meals for the week by adding recipes to specific days."
            actionLabel="Start Planning"
            iconName="calendar-outline"
            actions={[
              {
                label: "Add to Today",
                iconName: "today-outline",
                variant: "default",
              },
              {
                label: "Plan Week",
                iconName: "calendar-outline",
                variant: "outline",
              },
            ]}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.dark,
  },
  content: {
    flex: 1,
  },
});
