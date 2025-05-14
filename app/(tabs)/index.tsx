import React from "react";
import { StyleSheet, ScrollView, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRecipes } from "../context/RecipeContext";
import { colors, spacing, fontSizes } from "../utils/styleUtils";
import EmptyState from "../components/ui/EmptyState";

export default function HomeScreen() {
  const { recipes } = useRecipes();

  // If no recipes, show empty state
  if (recipes.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Recipe Saver</Text>
        </View>
        <EmptyState
          showGuide={true}
          title="Welcome to Recipe Saver!"
          message="Start by adding your first recipe. You can manually add recipes, or extract them from websites, photos, or Instagram."
        />
      </SafeAreaView>
    );
  }

  // Count items for different sections
  const favoriteRecipes = recipes.filter((recipe) => recipe.favorite);

  const renderStatCard = (
    title: string,
    count: number,
    icon: keyof typeof Ionicons.glyphMap,
    onPress: () => void
  ) => (
    <Pressable style={styles.statCard} onPress={onPress}>
      <View style={styles.statIconContainer}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={styles.statCount}>{count}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recipe Saver</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsContainer}>
            {renderStatCard("Recipes", recipes.length, "book-outline", () =>
              router.push("/(tabs)/recipes" as any)
            )}
            {renderStatCard(
              "Favorites",
              favoriteRecipes.length,
              "heart-outline",
              () => router.push("/(tabs)/recipes" as any)
            )}
            {renderStatCard("Shopping List", 0, "cart-outline", () =>
              router.push("/(tabs)/shopping" as any)
            )}
            {renderStatCard("Meal Plan", 0, "calendar-outline", () =>
              router.push("/(tabs)/meal-plan" as any)
            )}
          </View>
        </View>

        {favoriteRecipes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Favorites</Text>
              <Pressable onPress={() => router.push("/(tabs)/recipes" as any)}>
                <Text style={styles.seeAllText}>See All</Text>
              </Pressable>
            </View>

            <View>
              {favoriteRecipes.slice(0, 3).map((recipe) => (
                <Pressable
                  key={recipe.id}
                  style={styles.recipeItem}
                  onPress={() => router.push(`/recipe/${recipe.id}` as any)}
                >
                  <View style={styles.recipePlaceholder}>
                    <Ionicons
                      name="restaurant"
                      size={24}
                      color={colors.gray[300]}
                    />
                  </View>
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeTitle}>{recipe.title}</Text>
                    <Text style={styles.recipeSubtitle}>
                      {recipe.prepTime + recipe.cookTime} mins •{" "}
                      {recipe.servings} servings
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.gray[400]}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: "bold",
    color: colors.dark,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: spacing.md,
  },
  seeAllText: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    backgroundColor: colors.white,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + "10",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  statCount: {
    fontSize: fontSizes["2xl"],
    fontWeight: "bold",
    color: colors.dark,
  },
  statTitle: {
    fontSize: fontSizes.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  recipeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  recipePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: fontSizes.md,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  recipeSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.gray[500],
  },
});
