import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useRecipes } from "../context/RecipeContext";
import { colors, spacing } from "../utils/styleUtils";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const { getRecipeById } = useRecipes();

  // Get recipe details by ID
  const recipeId = Array.isArray(id) ? id[0] : id;
  const recipe = getRecipeById(recipeId as string);

  // If recipe not found
  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Recipe not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.meta}>
          {recipe.prepTime + recipe.cookTime} mins • {recipe.servings} servings
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>
        {recipe.ingredients.map((ingredient, index) => (
          <Text key={index} style={styles.ingredient}>
            • {ingredient}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        {recipe.instructions.map((instruction, index) => (
          <View key={index} style={styles.instructionContainer}>
            <Text style={styles.instructionNumber}>{index + 1}</Text>
            <Text style={styles.instruction}>{instruction}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  meta: {
    fontSize: 14,
    color: colors.gray[500],
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: spacing.md,
    color: colors.dark,
  },
  ingredient: {
    fontSize: 16,
    marginBottom: spacing.xs,
    color: colors.dark,
  },
  instructionContainer: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    backgroundColor: colors.primary,
    borderRadius: 12,
    color: colors.white,
    textAlign: "center",
    marginRight: spacing.sm,
    overflow: "hidden",
    lineHeight: 24,
    fontSize: 14,
    fontWeight: "600",
  },
  instruction: {
    flex: 1,
    fontSize: 16,
    color: colors.dark,
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 50,
    color: colors.gray[500],
  },
});
