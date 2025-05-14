import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../components/ui/EmptyState";
import { colors } from "../utils/styleUtils";

export default function RecipesScreen() {
  // In a real app, you would fetch recipes from context
  const hasRecipes = false; // Placeholder logic

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recipes</Text>
      </View>

      <View style={styles.content}>
        {hasRecipes ? (
          <Text>Recipe list will appear here</Text>
        ) : (
          <EmptyState showGuide={true} iconName="restaurant-outline" />
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
