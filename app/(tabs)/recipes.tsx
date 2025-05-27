import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import EmptyState from "@/components/ui/EmptyState";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import CategorizedTagFilter from "@/components/recipes/CategorizedTagFilter";
import { useAuth } from "@/context/AuthContext";
import { getUserRecipes } from "@/services/recipeService";
// import { migrateUserRecipeTags } from "@/services/tagMigration";
import { addBasicTagsToRecipes } from "@/services/simpleTagMigration";
import { colors, spacing, typography } from "@/utils/styleUtils";
import { Recipe } from "@/types";
import { eventEmitter, EVENTS } from "@/utils/eventEmitter";

const DEBUG_TAG_MIGRATION = false; // Set to true to enable tag migration button

export default function RecipesScreen() {
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isMigratingTags, setIsMigratingTags] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();
  const filtersScrollRef = useRef<ScrollView>(null);

  // Enhanced fetch function with better error handling
  const fetchRecipes = async (showRefreshIndicator = false) => {
    if (!user?.id) {
      setRecipes([]);
      setFilteredRecipes([]);
      setIsLoading(false);
      setIsRefreshing(false);
      setError(null);
      return;
    }

    console.log(`[RecipesScreen] Fetching recipes for user: ${user.id}`);

    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      const fetchedRecipesFromService = await getUserRecipes(user.id);

      const conformingRecipes: Recipe[] = fetchedRecipesFromService.map(
        (r) => ({
          ...r,
          id: r.id,
          title: r.title,
          ingredients: r.ingredients || [],
          instructions: r.instructions || [],
          prepTime: r.prepTime || 0,
          cookTime: r.cookTime || 0,
          servings: r.servings || 0,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          tags: r.tags || [],
        })
      );

      setRecipes(conformingRecipes);
      setFilteredRecipes(conformingRecipes);
      setRetryCount(0); // Reset retry count on success
      console.log(
        `[RecipesScreen] Successfully loaded ${conformingRecipes.length} recipes`
      );
    } catch (error) {
      console.error("[RecipesScreen] Error fetching recipes:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if it's a network error
      const isNetworkError =
        errorMessage.includes("Network request failed") ||
        errorMessage.includes("Unable to connect") ||
        errorMessage.includes("Failed to fetch");

      if (isNetworkError) {
        setError(
          "Unable to connect to the server. Please check your internet connection and try again."
        );

        // Auto-retry for network errors (up to 3 times)
        if (retryCount < 3 && !showRefreshIndicator) {
          console.log(
            `[RecipesScreen] Auto-retrying in 3 seconds... (attempt ${
              retryCount + 1
            }/3)`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            fetchRecipes(false);
          }, 3000);
          return;
        }
      } else {
        setError(`Failed to load recipes: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    if (user?.id) {
      fetchRecipes();
    }
  }, [user?.id]);

  // Listen for recipe events (simple version)
  useEffect(() => {
    const handleRecipeRefresh = () => {
      console.log("[RecipesScreen] Received refresh event");
      if (user?.id && !isLoading) {
        fetchRecipes();
      }
    };

    eventEmitter.on(EVENTS.RECIPES_REFRESH_NEEDED, handleRecipeRefresh);
    return () => {
      eventEmitter.off(EVENTS.RECIPES_REFRESH_NEEDED, handleRecipeRefresh);
    };
  }, [user?.id, isLoading]);

  // Focus effect (simple version)
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we don't have recipes loaded yet
      if (user?.id && recipes.length === 0 && !isLoading && !error) {
        console.log(
          "[RecipesScreen] Screen focused, no recipes loaded, fetching..."
        );
        fetchRecipes();
      }
    }, [user?.id, recipes.length, isLoading, error])
  );

  // Pull-to-refresh handler
  const onRefresh = () => {
    setRetryCount(0); // Reset retry count for manual refresh
    fetchRecipes(true);
  };

  // Manual retry handler
  const handleRetry = () => {
    setRetryCount(0);
    fetchRecipes(false);
  };

  // Manual tag migration function for testing
  const handleManualTagMigration = async () => {
    if (!user?.id) return;

    setIsMigratingTags(true);
    try {
      await addBasicTagsToRecipes(user.id);
      console.log("[RecipesScreen] Manual tag migration completed");
      // Refresh recipes after migration
      const refreshedRecipes = await getUserRecipes(user.id);
      const conformingRecipes: Recipe[] = refreshedRecipes.map((r) => ({
        ...r,
        tags: r.tags || [],
      }));
      setRecipes(conformingRecipes);
      setFilteredRecipes(conformingRecipes);
    } catch (error) {
      console.error("[RecipesScreen] Manual tag migration failed:", error);
    } finally {
      setIsMigratingTags(false);
    }
  };

  // Filter recipes based on search query and favorites (tag filtering is handled by CategorizedTagFilter)
  useEffect(() => {
    let filtered = recipes;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(query) ||
          recipe.description?.toLowerCase().includes(query) ||
          recipe.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter((recipe) => recipe.isFavorite);
    }

    // Only set filtered recipes if no tags are selected (let CategorizedTagFilter handle tag filtering)
    if (selectedTags.length === 0) {
      setFilteredRecipes(filtered);
    }
  }, [recipes, searchQuery, showFavoritesOnly, selectedTags]);

  // Handle tag filter changes
  const handleFilterChange = useCallback(
    (filtered: Recipe[]) => {
      let finalFiltered = filtered;

      // Apply search query to the tag-filtered results
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        finalFiltered = finalFiltered.filter(
          (recipe) =>
            recipe.title.toLowerCase().includes(query) ||
            recipe.description?.toLowerCase().includes(query) ||
            (recipe.tags || []).some((tag) => tag.toLowerCase().includes(query))
        );
      }

      // Apply favorites filter to the tag-filtered results
      if (showFavoritesOnly) {
        finalFiltered = finalFiltered.filter((recipe) => recipe.isFavorite);
      }

      setFilteredRecipes(finalFiltered);
    },
    [searchQuery, showFavoritesOnly]
  );

  // Handle tag selection changes
  const handleTagSelectionChange = useCallback((tags: string[]) => {
    setSelectedTags(tags);
  }, []);

  // Handle tag press from recipe cards
  const handleTagPress = useCallback(
    (tag: string) => {
      if (tag === "show_all") {
        // Handle show all tags - could navigate to a detailed view
        return;
      }

      const normalizedTag = tag.toLowerCase();
      const newSelectedTags = selectedTags.includes(normalizedTag)
        ? selectedTags.filter((t) => t !== normalizedTag)
        : [...selectedTags, normalizedTag];

      setSelectedTags(newSelectedTags);
    },
    [selectedTags]
  );

  // Handle search input changes
  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);

      // If no tags are selected, handle search filtering directly
      if (selectedTags.length === 0) {
        let filtered = recipes;

        if (query.trim()) {
          const searchQuery = query.toLowerCase().trim();
          filtered = filtered.filter(
            (recipe) =>
              recipe.title.toLowerCase().includes(searchQuery) ||
              recipe.description?.toLowerCase().includes(searchQuery) ||
              (recipe.tags || []).some((tag) =>
                tag.toLowerCase().includes(searchQuery)
              )
          );
        }

        // Apply favorites filter
        if (showFavoritesOnly) {
          filtered = filtered.filter((recipe) => recipe.isFavorite);
        }

        setFilteredRecipes(filtered);
      }
      // If tags are selected, the CategorizedTagFilter will handle the filtering
      // and call handleFilterChange which will apply search + favorites
    },
    [recipes, selectedTags, showFavoritesOnly]
  );

  const hasRecipes = recipes.length > 0;
  const displayedRecipes = filteredRecipes;

  const renderRecipeCard = ({ item }: { item: Recipe }) => (
    <View style={styles.recipeCardContainer}>
      <RecipeCard
        recipe={item}
        onPress={() => router.push(`/recipe/${item.id}`)}
        onTagPress={handleTagPress}
      />
    </View>
  );

  if (isLoading && recipes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Recipes</Text>
          {DEBUG_TAG_MIGRATION && (
            <TouchableOpacity
              style={styles.debugButton}
              onPress={handleManualTagMigration}
              disabled={isMigratingTags}
            >
              <Text style={styles.debugButtonText}>
                {isMigratingTags ? "Migrating..." : "Add Tags"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={{ marginTop: 10, color: colors.gray[600] }}>
            Loading recipes...
            {retryCount > 0 && ` (Retry ${retryCount}/3)`}
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && recipes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Recipes</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons
            name="cloud-offline-outline"
            size={64}
            color={colors.gray[400]}
            style={styles.errorIcon}
          />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="refresh" size={20} color={colors.white} />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!isLoading && recipes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Recipes</Text>
          {DEBUG_TAG_MIGRATION && (
            <TouchableOpacity
              style={styles.debugButton}
              onPress={handleManualTagMigration}
              disabled={isMigratingTags}
            >
              <Text style={styles.debugButtonText}>
                {isMigratingTags ? "Migrating..." : "Add Tags"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <EmptyState
          title="No Recipes Yet"
          message="Start by adding your first recipe. You can manually add recipes, or extract them from websites, photos, or Instagram."
          actionLabel="Add Recipe"
          iconName="book-outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Recipes</Text>
        {DEBUG_TAG_MIGRATION && (
          <TouchableOpacity
            style={styles.debugButton}
            onPress={handleManualTagMigration}
            disabled={isMigratingTags}
          >
            <Text style={styles.debugButtonText}>
              {isMigratingTags ? "Migrating..." : "Add Tags"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={colors.gray[400]}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            placeholderTextColor={colors.gray[400]}
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.favoritesButton,
            showFavoritesOnly && styles.favoritesButtonActive,
          ]}
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showFavoritesOnly ? "heart" : "heart-outline"}
            size={20}
            color={showFavoritesOnly ? colors.white : colors.gray[600]}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <CategorizedTagFilter
          recipes={recipes}
          onFilterChange={handleFilterChange}
          selectedTags={selectedTags}
          onTagSelectionChange={handleTagSelectionChange}
        />
      </View>

      <View style={styles.content}>
        {!hasRecipes ? (
          <EmptyState
            title="No Recipes Yet"
            message="Start by adding your first recipe. You can manually add recipes, or extract them from websites, photos, or Instagram."
            actionLabel="Add Recipe"
            iconName="book-outline"
          />
        ) : displayedRecipes.length === 0 ? (
          <EmptyState
            title={
              showFavoritesOnly ? "No Favorite Recipes" : "No Matching Recipes"
            }
            message={
              showFavoritesOnly
                ? "You haven't marked any recipes as favorites yet. Tap the heart icon on any recipe to add it to your favorites."
                : selectedTags.length > 0
                ? `No recipes found with the selected tags: ${selectedTags.join(
                    ", "
                  )}`
                : "No recipes match your search criteria."
            }
            actionLabel={
              showFavoritesOnly ? "View All Recipes" : "Clear Filters"
            }
            iconName={showFavoritesOnly ? "heart-outline" : "filter-outline"}
            onActionClick={() => {
              if (showFavoritesOnly) {
                setShowFavoritesOnly(false);
              } else {
                setSelectedTags([]);
                setSearchQuery("");
              }
            }}
          />
        ) : (
          <FlatList
            data={displayedRecipes}
            renderItem={renderRecipeCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.recipeGrid}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.dark,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: colors.dark,
  },
  filtersContainer: {
    marginBottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  recipeGrid: {
    paddingVertical: 12,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  recipeCardContainer: {
    width: "48%",
    marginBottom: 20,
    elevation: 2,
    minHeight: 240,
  },
  debugButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  debugButtonText: {
    marginLeft: 4,
    color: colors.gray[700],
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 8,
  },
  errorMessage: {
    color: colors.gray[600],
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    marginLeft: 8,
    color: colors.white,
    fontWeight: "500",
  },
  favoritesButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.gray[200],
  },
  favoritesButtonActive: {
    backgroundColor: colors.primary,
  },
});
