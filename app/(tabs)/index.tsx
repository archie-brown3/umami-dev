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
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";
import { colors, spacing, borderRadius, typography } from "@/utils/styleUtils";
import { useRecipes } from "@/context/RecipeContext";
import { useMealPlan } from "@/context/MealPlanContext";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { Paywall } from "@/components/subscription/Paywall";
import TodaysMealPlan from "@/components/meal-planning/TodaysMealPlan";
import { Recipe } from "@/types";

import { useSubscription } from "@/context/SubscriptionContext";

// Separate component for recipe items to avoid hooks in render functions
const RecentRecipeItem = ({
  item,
  onPress,
}: {
  item: Recipe;
  onPress: (recipe: Recipe) => void;
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      style={styles.recentRecipeCard}
      onPress={() => onPress(item)}
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

export default function HomeScreen() {
  const { recipes } = useRecipes();
  const { weekMeals } = useMealPlan();
  const { isPremium } = useFeatureGating();
  const { presentPaywall } = useSubscription();

  const [greeting, setGreeting] = useState("");
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([]);
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
      setRecentRecipes([]);
      // Only set loading to false if we're sure recipes have been loaded (not just empty)
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

  // Get total number of recipes
  const totalRecipeCount = recipes?.length || 0;

  // Get planned meals for today from the meal plan
  const today = new Date().toISOString().split("T")[0];
  const todaysMeals = weekMeals?.[today] || {};
  const plannedMealsToday = Object.values(todaysMeals).reduce(
    (total, meals) => {
      return total + (Array.isArray(meals) ? meals.length : 0);
    },
    0
  );

  const handleMealPress = (mealType: string) => {
    router.push(`/(tabs)/meal-plan?meal=${mealType}&date=${today}`);
  };

  const handleRecipePress = (recipe: Recipe) => {
    router.push(`/recipe/${recipe.id}`);
  };

  const handleViewAllRecipes = () => {
    router.push("/(tabs)/recipes");
  };

  const renderRecentRecipeItem = ({ item }: { item: Recipe }) => (
    <RecentRecipeItem item={item} onPress={handleRecipePress} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeHeader}>
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.greetingText}>🧑‍🍳 {greeting}!</Text>
              <Text style={styles.subtitleText}>What's cooking today?</Text>
            </View>
            <View style={styles.headerActions}>
              {!isPremium && (
                <TouchableOpacity
                  style={styles.premiumButton}
                  onPress={() => presentPaywall("premium_access")}
                  activeOpacity={0.8}
                >
                  <View style={styles.premiumButtonContent}>
                    <Ionicons name="star" size={16} color={colors.white} />
                    <Text style={styles.premiumButtonText}>Premium</Text>
                  </View>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => router.push("/profile")}
                style={styles.profileButton}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={28}
                  color={colors.gray[600]}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[styles.statCard, styles.statCardRecipes]}
            onPress={() => router.push("/(tabs)/recipes")}
            activeOpacity={0.8}
          >
            <Text style={styles.statNumber}>{totalRecipeCount}</Text>
            <Text style={styles.statLabel}>📚 recipes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statCard, styles.statCardMeals]}
            onPress={() => router.push("/(tabs)/meal-plan")}
            activeOpacity={0.8}
          >
            <Text style={styles.statNumber}>{plannedMealsToday}</Text>
            <Text style={styles.statLabel}>🍽️ planned today</Text>
          </TouchableOpacity>
        </View>

        {/* Recently Created Recipes */}
        <View style={styles.recentRecipesSection}>
          <View style={styles.sectionHeaderContainer}>
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
          </View>

          <View style={styles.recentRecipesContent}>
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
        </View>

        {/* Today's Highlights */}
        <View style={styles.highlightsSection}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>🌟 Today's Highlights</Text>
            <Text style={styles.sectionSubtitle}>
              Your planned meals for today
            </Text>
          </View>

          {/* Today's Meal Plan */}
          <TodaysMealPlan compact={false} onMealPress={handleMealPress} />
        </View>
      </ScrollView>

      <Paywall
        visible={false}
        onClose={() => {}}
        feature="Premium Home Features"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    paddingBottom: 90, // Increased for tab bar clearance
  },
  welcomeSection: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    marginBottom: spacing.md,
  },
  welcomeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  welcomeTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  subtitleText: {
    fontSize: 16,
    color: colors.gray[600],
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  premiumButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.orange[500],
    shadowColor: colors.orange[500],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  premiumButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 14,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    borderLeftWidth: 4,
    shadowColor: colors.gray[200],
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statCardRecipes: {
    borderLeftColor: "#4ECDC4",
  },
  statCardMeals: {
    borderLeftColor: "#FF6B6B",
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
  recentRecipesSection: {
    marginBottom: spacing.md,
  },
  sectionHeaderContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.dark,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: "500",
    marginTop: spacing.xs,
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
  recentRecipesContent: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
  },
  loadingContainer: {
    padding: spacing.lg,
  },
  skeletonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skeletonCard: {
    flexDirection: "row",
    alignItems: "center",
    width: 200,
    marginHorizontal: spacing.md,
  },
  skeletonImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.gray[200],
    marginRight: spacing.md,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    height: 16,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  skeletonMeta: {
    height: 12,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    width: "60%",
  },
  recentRecipesList: {
    paddingHorizontal: spacing.md,
  },
  recentRecipeCard: {
    width: 200,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray[100],
    shadowColor: colors.gray[200],
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recipeImageContainer: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: spacing.md,
    position: "relative",
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
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  recipeMetadata: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  recipeTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.md,
  },
  recipeTime: {
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: "500",
    marginLeft: 4,
  },
  recipeServingsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  recipeServings: {
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: "500",
    marginLeft: 4,
  },
  recipeBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: colors.white,
    borderRadius: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  recipeBadgeText: {
    fontSize: 11,
    color: colors.gray[700],
    fontWeight: "600",
  },
  favoriteIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  highlightsSection: {
    marginBottom: spacing.lg,
  },
  emptyRecipesContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
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
    maxWidth: 240,
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
