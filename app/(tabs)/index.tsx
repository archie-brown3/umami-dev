import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";
import { colors, spacing, borderRadius, typography } from "@/utils/styleUtils";
import { useRecipes } from "@/context/RecipeContext";
import { useMealPlan } from "@/context/MealPlanContext";
import { useAuth } from "@/context/AuthContext";
import TodaysMealPlan from "@/components/meal-planning/TodaysMealPlan";
import { Recipe } from "@/types";
import { getUserRecipes } from "@/services/recipeService";

export default function HomeScreen() {
  const { recipes } = useRecipes();
  const { weekMeals } = useMealPlan();
  const { user } = useAuth();

  const [greeting, setGreeting] = useState("");
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
  const [totalRecipeCount, setTotalRecipeCount] = useState(0);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 17) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  // Fetch recent recipes from database
  useEffect(() => {
    const fetchRecentRecipes = async () => {
      if (!user?.id) return;

      setIsLoadingRecipes(true);
      try {
        const allRecipes = await getUserRecipes(user.id);
        // Store total count
        setTotalRecipeCount(allRecipes.length);
        // Get the 6 most recently created recipes
        const recent = allRecipes
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 6);
        setRecentRecipes(recent);
      } catch (error) {
        console.error("Error fetching recent recipes:", error);
      } finally {
        setIsLoadingRecipes(false);
      }
    };

    fetchRecentRecipes();
  }, [user?.id]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const fetchRecentRecipes = async () => {
        if (!user?.id) return;

        try {
          const allRecipes = await getUserRecipes(user.id);
          setTotalRecipeCount(allRecipes.length);
          const recent = allRecipes
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .slice(0, 6);
          setRecentRecipes(recent);
        } catch (error) {
          console.error("Error fetching recent recipes:", error);
        }
      };

      fetchRecentRecipes();
    }, [user?.id])
  );

  // Calculate stats - use total recipe count from database
  const today = new Date().toISOString().split("T")[0];
  const todaysMeals = weekMeals[today] || {};
  const plannedMealsToday = Object.values(todaysMeals).flat().length;

  const handleMealPress = (mealType: string) => {
    router.push(`/meal-plan?meal=${mealType}`);
  };

  const handleRecipePress = (recipe: Recipe) => {
    router.push(`/recipe/${recipe.id}`);
  };

  const handleViewAllRecipes = () => {
    router.push("/(tabs)/recipes");
  };

  const renderRecentRecipeItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recentRecipeCard}
      onPress={() => handleRecipePress(item)}
      activeOpacity={0.7}
    >
      {item.imageUrl ? (
        <View style={styles.recipeImageContainer}>
          <Text style={styles.recipeImagePlaceholder}>🍽️</Text>
        </View>
      ) : (
        <View style={styles.recipeImageContainer}>
          <Text style={styles.recipeImagePlaceholder}>🍽️</Text>
        </View>
      )}
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.recipeTime}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeHeader}>
            <View>
              <Text style={styles.greetingText}> 🧑‍🍳 {greeting}!</Text>
              <Text style={styles.subtitleText}>What's cooking today?</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              style={styles.profileButton}
            >
              <Ionicons
                name="person-circle-outline"
                size={32}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { borderLeftColor: "#4ECDC4" }]}>
            <Text style={styles.statNumber}>{totalRecipeCount}</Text>
            <Text style={styles.statLabel}>📚 recipes</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: "#FF6B6B" }]}>
            <Text style={styles.statNumber}>{plannedMealsToday}</Text>
            <Text style={styles.statLabel}>🍽️ planned today</Text>
          </View>
        </View>

        {/* Today's Highlights - More Prominent */}
        <View style={styles.highlightsSection}>
          <View style={styles.highlightsHeader}>
            <Text style={styles.highlightsTitle}>🌟 Today's Highlights</Text>
            <Text style={styles.highlightsSubtitle}>
              Your meals and latest recipes
            </Text>
          </View>

          {/* Today's Meal Plan */}
          <TodaysMealPlan compact={false} onMealPress={handleMealPress} />
        </View>

        {/* Recently Created Recipes */}
        <View style={styles.recentRecipesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🆕 Recently Created</Text>
            <TouchableOpacity
              onPress={handleViewAllRecipes}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {isLoadingRecipes ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading recent recipes...</Text>
            </View>
          ) : recentRecipes.length > 0 ? (
            <FlatList
              data={recentRecipes}
              renderItem={renderRecentRecipeItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentRecipesList}
            />
          ) : (
            <View style={styles.emptyRecipesContainer}>
              <Text style={styles.emptyRecipesText}>No recipes yet</Text>
              <TouchableOpacity
                style={styles.addFirstRecipeButton}
                onPress={() => router.push("/recipe/create")}
              >
                <Ionicons name="add-circle" size={20} color={colors.white} />
                <Text style={styles.addFirstRecipeText}>
                  Add Your First Recipe
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  welcomeSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  welcomeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingText: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  subtitleText: {
    fontSize: 18,
    color: colors.gray[600],
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: "500",
  },
  highlightsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  highlightsHeader: {
    marginBottom: spacing.lg,
  },
  highlightsTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  highlightsSubtitle: {
    fontSize: 16,
    color: colors.gray[600],
    fontWeight: "500",
  },
  recentRecipesSection: {
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.dark,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
    marginRight: spacing.xs,
  },
  recentRecipesList: {
    paddingRight: spacing.lg,
  },
  recentRecipeCard: {
    width: 140,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  recipeImageContainer: {
    height: 100,
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  recipeImagePlaceholder: {
    fontSize: 32,
  },
  recipeInfo: {
    padding: spacing.md,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  recipeTime: {
    fontSize: 12,
    color: colors.gray[500],
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  emptyRecipesContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyRecipesText: {
    fontSize: 16,
    color: colors.gray[500],
    marginBottom: spacing.md,
  },
  addFirstRecipeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  addFirstRecipeText: {
    color: colors.white,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
  profileButton: {
    padding: spacing.xs,
  },
});
