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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import EmptyState from "@/components/ui/EmptyState";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { TagFilter } from "@/components/recipes/TagFilter";
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

  // Handle tag filter changes
  const handleFilterChange = useCallback(
    (filtered: Recipe[]) => {
      // Apply search query to the tag-filtered results
      if (searchQuery.trim()) {
        const searchFiltered = filtered.filter(
          (recipe) =>
            recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            recipe.description
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            (recipe.tags || []).some((tag) =>
              tag.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
        setFilteredRecipes(searchFiltered);
      } else {
        setFilteredRecipes(filtered);
      }
    },
    [searchQuery]
  );

  // Handle tag selection changes
  const handleTagSelectionChange = useCallback((tags: string[]) => {
    setSelectedTags(tags);
  }, []);

  // Handle search input changes
  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);

      // Apply search to current tag-filtered recipes
      if (query.trim()) {
        const baseRecipes =
          selectedTags.length > 0
            ? recipes.filter((recipe) => {
                const recipeTags = (recipe.tags || []).map((tag) =>
                  tag.toLowerCase()
                );
                return selectedTags.every((selectedTag) =>
                  recipeTags.includes(selectedTag.toLowerCase())
                );
              })
            : recipes;

        const searchFiltered = baseRecipes.filter(
          (recipe) =>
            recipe.title.toLowerCase().includes(query.toLowerCase()) ||
            recipe.description?.toLowerCase().includes(query.toLowerCase()) ||
            (recipe.tags || []).some((tag) =>
              tag.toLowerCase().includes(query.toLowerCase())
            )
        );
        setFilteredRecipes(searchFiltered);
      } else {
        // Re-apply tag filtering if search is cleared
        if (selectedTags.length > 0) {
          const tagFiltered = recipes.filter((recipe) => {
            const recipeTags = (recipe.tags || []).map((tag) =>
              tag.toLowerCase()
            );
            return selectedTags.every((selectedTag) =>
              recipeTags.includes(selectedTag.toLowerCase())
            );
          });
          setFilteredRecipes(tagFiltered);
        } else {
          setFilteredRecipes(recipes);
        }
      }
    },
    [recipes, selectedTags]
  );

  const hasRecipes = recipes.length > 0;
  const displayedRecipes = filteredRecipes;

  const renderRecipeCard = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeCardContainer}
      onPress={() => router.push(`/recipe/${item.id}`)}
    >
      <RecipeCard recipe={item} />
    </TouchableOpacity>
  );

  if (isLoading && recipes.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
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
      </SafeAreaView>
    );
  }

  // Error state
  if (error && recipes.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
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
      </SafeAreaView>
    );
  }

  if (!isLoading && recipes.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
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
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={20} color={colors.gray[700]} />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersAndTabsContainer}>
        <TagFilter
          recipes={recipes}
          onFilterChange={handleFilterChange}
          selectedTags={selectedTags}
          onTagSelectionChange={handleTagSelectionChange}
        />

        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tabButton, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>
              All Recipes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabButton}>
            <Ionicons name="heart-outline" size={18} color={colors.gray[500]} />
            <Text style={styles.tabText}>Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabButton}>
            <Ionicons
              name="bookmark-outline"
              size={18}
              color={colors.gray[500]}
            />
            <Text style={styles.tabText}>My Lists</Text>
          </TouchableOpacity>
        </View>
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
            title="No Matching Recipes"
            message={
              selectedTags.length > 0
                ? `No recipes found with the selected tags: ${selectedTags.join(
                    ", "
                  )}`
                : "No recipes match your search criteria."
            }
            actionLabel="Clear Filters"
            iconName="filter-outline"
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
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.dark,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: colors.dark,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  filterText: {
    marginLeft: 4,
    color: colors.gray[700],
    fontWeight: "500",
  },
  filtersAndTabsContainer: {
    marginBottom: 0,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.gray[500],
    fontWeight: "500",
    marginLeft: 4,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: "600",
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
});
