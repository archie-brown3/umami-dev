import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, typography } from "@/utils/styleUtils";
import { useRecipes } from "@/context/RecipeContext";
import { useMealPlan } from "@/context/MealPlanContext";
import { useAuth } from "@/context/AuthContext";
import TodaysMealPlan from "@/components/meal-planning/TodaysMealPlan";
import { Recipe } from "@/types";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

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

  // Update recipe data when recipes from context change
  useEffect(() => {
    if (recipes && recipes.length > 0) {
      setTotalRecipeCount(recipes.length);
      // Get the 6 most recently created recipes
      const recent = [...recipes]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 6);
      setRecentRecipes(recent);
      setIsLoadingRecipes(false);
    } else {
      setTotalRecipeCount(0);
      setRecentRecipes([]);
      // Only set loading to false if we're sure recipes have been loaded (not just empty)
      // This prevents showing "no recipes" immediately on app start
      if (recipes !== undefined) {
        setIsLoadingRecipes(false);
      }
    }
  }, [recipes]);

  // Set initial loading state
  useEffect(() => {
    if (recipes === undefined) {
      setIsLoadingRecipes(true);
    }
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Data is already managed by contexts, no need to fetch again
      // Just ensure we have the latest data
      if (recipes && recipes.length > 0) {
        setTotalRecipeCount(recipes.length);
        const recent = [...recipes]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 6);
        setRecentRecipes(recent);
      }
    }, [recipes])
  );

  // Calculate stats - use data from contexts
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

  const renderRecentRecipeItem = ({ item }: { item: Recipe }) => {
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    return (
      <TouchableOpacity
        style={styles.recentRecipeCard}
        onPress={() => handleRecipePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.recipeImageContainer}>
          {item.imageUrl && !imageError ? (
            <>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.recipeImage}
                onLoadStart={() => {
                  setImageLoading(true);
                  setImageError(false);
                }}
                onLoad={() => {
                  console.log(
                    `Successfully loaded image for recipe: ${item.title}`
                  );
                  setImageLoading(false);
                }}
                onError={(error) => {
                  console.log(
                    `Failed to load image for recipe: ${item.title}`,
                    error.nativeEvent
                  );
                  setImageLoading(false);
                  setImageError(true);
                }}
                resizeMode="cover"
              />
              {imageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}
            </>
          ) : (
            <View style={styles.recipeImagePlaceholder}>
              <Ionicons name="restaurant" size={32} color={colors.gray[400]} />
            </View>
          )}

          {/* Recipe type badge */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.recipeBadge}>
              <Text style={styles.recipeBadgeText}>
                {item.tags[0].length > 8
                  ? item.tags[0].substring(0, 8) + "..."
                  : item.tags[0]}
              </Text>
            </View>
          )}

          {/* Favorite indicator */}
          {item.isFavorite && (
            <View style={styles.favoriteIndicator}>
              <Ionicons name="heart" size={16} color={colors.red[500]} />
            </View>
          )}
        </View>

        <View style={styles.recipeInfo}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.recipeMetadata}>
            {item.prepTime && item.cookTime ? (
              <View style={styles.recipeTimeContainer}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color={colors.gray[500]}
                />
                <Text style={styles.recipeTime}>
                  {item.prepTime + item.cookTime}m
                </Text>
              </View>
            ) : (
              <View style={styles.recipeTimeContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={colors.gray[500]}
                />
                <Text style={styles.recipeTime}>
                  {new Date(item.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
            )}
            {item.servings && (
              <View style={styles.recipeServingsContainer}>
                <Ionicons
                  name="people-outline"
                  size={12}
                  color={colors.gray[500]}
                />
                <Text style={styles.recipeServings}>{item.servings}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 70 },
        ]}
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
          <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: "#4ECDC4" }]}
            onPress={() => router.push("/(tabs)/recipes")}
            activeOpacity={0.8}
          >
            <Text style={styles.statNumber}>{totalRecipeCount}</Text>
            <Text style={styles.statLabel}>📚 recipes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statCard, { borderLeftColor: "#FF6B6B" }]}
            onPress={() => router.push("/(tabs)/meal-plan")}
            activeOpacity={0.8}
          >
            <Text style={styles.statNumber}>{plannedMealsToday}</Text>
            <Text style={styles.statLabel}>🍽️ planned today</Text>
          </TouchableOpacity>
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
              <View style={styles.skeletonContainer}>
                {[1, 2, 3].map((index) => (
                  <View key={index} style={styles.skeletonCard}>
                    <View style={styles.skeletonImage} />
                    <View style={styles.skeletonContent}>
                      <View style={styles.skeletonTitle} />
                      <View style={styles.skeletonMeta} />
                    </View>
                  </View>
                ))}
              </View>
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
              <Ionicons
                name="restaurant-outline"
                size={48}
                color={colors.gray[400]}
              />
              <Text style={styles.emptyRecipesText}>No recipes yet</Text>
              <Text style={styles.emptyRecipesSubtext}>
                Start building your recipe collection by adding your first
                recipe
              </Text>
              <TouchableOpacity
                style={styles.addFirstRecipeButton}
                onPress={() => router.push("/add-recipe")}
              >
                <Ionicons name="add-circle" size={20} color={colors.white} />
                <Text style={styles.addFirstRecipeText}>
                  Add Your First Recipe
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Today's Highlights */}
        <View style={styles.highlightsSection}>
          <View style={styles.highlightsHeader}>
            <Text style={styles.highlightsTitle}>🌟 Today's Highlights</Text>
            <Text style={styles.highlightsSubtitle}>
              Your planned meals for today
            </Text>
          </View>

          {/* Today's Meal Plan */}
          <TodaysMealPlan compact={false} onMealPress={handleMealPress} />
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
    paddingHorizontal: spacing.lg,
  },
  welcomeSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    marginBottom: spacing.lg,
  },
  welcomeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingText: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  subtitleText: {
    fontSize: 16,
    color: colors.gray[600],
    fontWeight: "500",
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  statsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: "#4ECDC4",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: "500",
  },
  recentRecipesSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.dark,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
    marginRight: spacing.xs,
  },
  loadingContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  skeletonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skeletonCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  skeletonImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.gray[200],
  },
  skeletonContent: {
    flex: 1,
    paddingLeft: spacing.md,
  },
  skeletonTitle: {
    height: 20,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  skeletonMeta: {
    height: 12,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
  },
  recentRecipesList: {
    paddingHorizontal: spacing.md,
  },
  recentRecipeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    marginRight: spacing.md,
  },
  recipeImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: spacing.md,
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.gray[200],
    alignItems: "center",
    justifyContent: "center",
  },
  recipeInfo: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  recipeMetadata: {
    flexDirection: "row",
    alignItems: "center",
  },
  recipeTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.md,
  },
  recipeTime: {
    fontSize: 14,
    color: colors.gray[500],
    fontWeight: "500",
  },
  recipeServingsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  recipeServings: {
    fontSize: 14,
    color: colors.gray[500],
    fontWeight: "500",
  },
  recipeBadge: {
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    padding: spacing.xs,
    marginRight: spacing.md,
  },
  recipeBadgeText: {
    fontSize: 12,
    color: colors.gray[600],
    fontWeight: "500",
  },
  favoriteIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  highlightsSection: {
    marginBottom: spacing.lg,
  },
  highlightsHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    marginBottom: spacing.lg,
  },
  highlightsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.dark,
  },
  highlightsSubtitle: {
    fontSize: 16,
    color: colors.gray[600],
    fontWeight: "500",
  },
  emptyRecipesContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyRecipesText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.gray[600],
    marginTop: spacing.md,
    textAlign: "center",
  },
  emptyRecipesSubtext: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
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
});
