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
import { colors, spacing, borderRadius, typography } from "@/utils/styleUtils";
import { useRecipes } from "@/context/RecipeContext";
import { useMealPlan } from "@/context/MealPlanContext";
import { useAuth } from "@/context/AuthContext";
import TodaysMealPlan from "@/components/meal-planning/TodaysMealPlan";
import { Recipe } from "@/types";
import { getUserRecipes } from "@/services/recipeService";

export default function HomeScreen() {
  // const { recipes } = useRecipes();
  // const { weekMeals } = useMealPlan();
  // const { user } = useAuth();

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
  // useEffect(() => {
  //   const fetchRecentRecipes = async () => {
  //     if (!user?.id) return;

  //     setIsLoadingRecipes(true);
  //     try {
  //       const allRecipes = await getUserRecipes(user.id);
  //       // Store total count
  //       setTotalRecipeCount(allRecipes.length);
  //       // Get the 6 most recently created recipes
  //       const recent = allRecipes
  //         .sort(
  //           (a, b) =>
  //             new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  //         )
  //         .slice(0, 6);
  //       setRecentRecipes(recent);
  //     } catch (error) {
  //       console.error("Error fetching recent recipes:", error);
  //     } finally {
  //       setIsLoadingRecipes(false);
  //     }
  //   };

  //   fetchRecentRecipes();
  // }, [user?.id]);

  // Refresh data when screen comes into focus
  // useFocusEffect(
  //   React.useCallback(() => {
  //     const fetchRecentRecipes = async () => {
  //       if (!user?.id) return;

  //       try {
  //         const allRecipes = await getUserRecipes(user.id);
  //         setTotalRecipeCount(allRecipes.length);
  //         const recent = allRecipes
  //           .sort(
  //             (a, b) =>
  //               new Date(b.createdAt).getTime() -
  //               new Date(a.createdAt).getTime()
  //           )
  //           .slice(0, 6);
  //         setRecentRecipes(recent);
  //       } catch (error) {
  //         console.error("Error fetching recent recipes:", error);
  //       }
  //     };

  //     fetchRecentRecipes();
  //   }, [user?.id])
  // );

  // Calculate stats - use total recipe count from database
  const today = new Date().toISOString().split("T")[0];
  // const todaysMeals = weekMeals[today] || {};
  // const plannedMealsToday = Object.values(todaysMeals).flat().length;
  const plannedMealsToday = 0; // Temporary placeholder

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
        {/* Quick Navigation Buttons
        <View style={styles.quickNavSection}>
          <Text style={styles.quickNavTitle}>🚀 Quick Actions</Text>
          <View style={styles.quickNavButtons}>
            <TouchableOpacity
              style={[styles.navButton, styles.recipesButton]}
              onPress={() => router.push("/(tabs)/recipes")}
              activeOpacity={0.8}
            >
              <View style={styles.navButtonIcon}>
                <Ionicons name="book" size={24} color={colors.white} />
              </View>
              <View style={styles.navButtonContent}>
                <Text style={styles.navButtonTitle}>My Recipes</Text>
                <Text style={styles.navButtonSubtitle}>
                  Browse & manage your collection
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, styles.mealPlanButton]}
              onPress={() => router.push("/(tabs)/meal-plan")}
              activeOpacity={0.8}
            >
              <View style={styles.navButtonIcon}>
                <Ionicons name="calendar" size={24} color={colors.white} />
              </View>
              <View style={styles.navButtonContent}>
                <Text style={styles.navButtonTitle}>Meal Planning</Text>
                <Text style={styles.navButtonSubtitle}>
                  Plan your weekly meals
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View> */}
        {/* Recently Created Recipes - Moved above Today's Highlights */}
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
        {/* Today's Highlights - Moved below Recently Created */}
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
    paddingBottom: spacing.xxl,
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
    justifyContent: "space-between",
    alignItems: "center",
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
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
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
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
  quickNavSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  quickNavTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: spacing.md,
  },
  quickNavButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navButtonIcon: {
    marginRight: spacing.md,
  },
  navButtonContent: {
    flex: 1,
  },
  navButtonTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.white,
    marginBottom: 2,
  },
  navButtonSubtitle: {
    fontSize: 12,
    color: colors.gray[300],
  },
  recipesButton: {
    flex: 1,
  },
  mealPlanButton: {
    flex: 1,
  },
  recentRecipesSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.dark,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    marginRight: spacing.xs,
  },
  highlightsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  highlightsHeader: {
    marginBottom: spacing.lg,
  },
  highlightsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  highlightsSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: "500",
  },
  recentRecipesList: {
    paddingRight: spacing.lg,
    paddingLeft: 2,
  },
  recentRecipeCard: {
    width: 140,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  recipeImageContainer: {
    height: 100,
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  recipeImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.gray[50],
  },
  recipeInfo: {
    padding: spacing.md,
    flex: 1,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: spacing.sm,
    lineHeight: 18,
    minHeight: 36,
  },
  recipeMetadata: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recipeTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  recipeTime: {
    fontSize: 12,
    color: colors.gray[500],
    marginLeft: spacing.xs,
  },
  recipeServingsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  recipeServings: {
    fontSize: 12,
    color: colors.gray[500],
    marginLeft: spacing.xs,
  },
  recipeBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    maxWidth: 80,
  },
  recipeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.white,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  skeletonContainer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingLeft: 2,
  },
  skeletonCard: {
    width: 140,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginRight: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  skeletonImage: {
    height: 100,
    backgroundColor: colors.gray[100],
  },
  skeletonContent: {
    padding: spacing.md,
  },
  skeletonTitle: {
    height: 16,
    backgroundColor: colors.gray[100],
    marginBottom: spacing.sm,
    borderRadius: 4,
  },
  skeletonMeta: {
    height: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    width: "70%",
  },
  emptyRecipesContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginHorizontal: 2,
  },
  emptyRecipesText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray[600],
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptyRecipesSubtext: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  addFirstRecipeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addFirstRecipeText: {
    color: colors.white,
    fontWeight: "600",
    marginLeft: spacing.xs,
    fontSize: 15,
  },
  profileButton: {
    padding: spacing.xs,
  },
  favoriteIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.white,
    padding: 4,
    borderRadius: borderRadius.full,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
});
