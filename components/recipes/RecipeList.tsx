import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, spacing } from "@/utils/styleUtils";
import { Recipe } from "@/types";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import CategorizedTagFilter from "@/components/recipes/CategorizedTagFilter";
import EmptyState from "@/components/common/EmptyState";
import { useRecipes } from "@/context/RecipeContext";

interface RecipeListProps {
  recipes: Recipe[];
  onPremiumFeaturePress: (feature: string) => void;
}

const RecipeList: React.FC<RecipeListProps> = ({
  recipes,
  onPremiumFeaturePress,
}) => {
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>(recipes);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const router = useRouter();

  // Get the refresh function from context
  const { refreshRecipes, isLoading } = useRecipes();

  // Update filtered recipes when recipes prop changes
  useEffect(() => {
    setFilteredRecipes(recipes);
  }, [recipes]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    console.log("[RecipeList] Pull to refresh triggered");
    try {
      await refreshRecipes();
      console.log("[RecipeList] Refresh completed successfully");
    } catch (error) {
      console.error("[RecipeList] Refresh failed:", error);
    }
  }, [refreshRecipes]);

  // Handle filter changes
  const handleFilterChange = useCallback(
    (filtered: Recipe[]) => {
      let finalFiltered = filtered;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        finalFiltered = finalFiltered.filter(
          (recipe) =>
            recipe.title.toLowerCase().includes(query) ||
            recipe.description?.toLowerCase().includes(query) ||
            recipe.tags?.some((tag) => tag.toLowerCase().includes(query))
        );
      }

      if (showFavoritesOnly) {
        finalFiltered = finalFiltered.filter((recipe) => recipe.isFavorite);
      }

      setFilteredRecipes(finalFiltered);
    },
    [searchQuery, showFavoritesOnly]
  );

  // Handle tag selection
  const handleTagSelectionChange = useCallback((tags: string[]) => {
    setSelectedTags(tags);
  }, []);

  // Handle tag press from recipe cards or header
  const handleTagPress = useCallback(
    (tag: string) => {
      const normalizedTag = tag.toLowerCase();
      const newSelectedTags = selectedTags.includes(normalizedTag)
        ? selectedTags.filter((t) => t !== normalizedTag)
        : [...selectedTags, normalizedTag];

      setSelectedTags(newSelectedTags);
    },
    [selectedTags]
  );

  const renderRecipeCard = ({ item }: { item: Recipe }) => (
    <View style={styles.recipeCardContainer}>
      <RecipeCard
        recipe={item}
        onPress={() => router.push(`/recipe/${item.id}`)}
        onTagPress={handleTagPress}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search and Favorites */}
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
            onChangeText={setSearchQuery}
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

      {/* Advanced Filters */}
      <View style={styles.filtersContainer}>
        <CategorizedTagFilter
          recipes={recipes}
          onFilterChange={handleFilterChange}
          selectedTags={selectedTags}
          onTagSelectionChange={handleTagSelectionChange}
        />
      </View>

      {/* Recipe Grid */}
      <FlatList
        data={filteredRecipes}
        renderItem={renderRecipeCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.recipeGrid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            title={
              showFavoritesOnly ? "No Favorite Recipes" : "No Matching Recipes"
            }
            message={
              showFavoritesOnly
                ? "You haven't marked any recipes as favorites yet."
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
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    height: 44,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: colors.dark,
    fontSize: 16,
  },
  filtersContainer: {
    marginBottom: spacing.sm,
  },
  recipeGrid: {
    padding: spacing.sm,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  recipeCardContainer: {
    width: "48%",
    marginBottom: spacing.md,
    elevation: 2,
    minHeight: 240,
  },
  favoritesButton: {
    padding: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.gray[200],
    marginLeft: spacing.sm,
    height: 44,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  favoritesButtonActive: {
    backgroundColor: colors.primary,
  },
});

export default RecipeList;
