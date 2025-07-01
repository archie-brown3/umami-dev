import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, spacing } from "@/utils/styleUtils";
import { Recipe } from "@/types";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import CategorizedTagFilter from "@/components/recipes/CategorizedTagFilter";
import EmptyState from "@/components/common/EmptyState";
import { useRecipes } from "@/context/RecipeContext";
import {
  processRecipeTags,
  formatTagName,
  getTagCategoryColor,
  getCuisineFlag,
  ProcessedTags,
} from "@/services/tagUtils";

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

  // Process all tags from recipes for header display
  const processedTags = useMemo(() => {
    return processRecipeTags(recipes);
  }, [recipes]);

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

  // Render tag overview header
  const renderTagsHeader = () => {
    if (processedTags.allTags.length === 0) return null;

    return (
      <View style={styles.tagsHeaderContainer}>
        <Text style={styles.tagsHeaderTitle}>
          Popular Tags ({processedTags.allTags.length})
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsHeaderScroll}
        >
          {processedTags.categories.map((category) => (
            <View key={category.name} style={styles.categoryHeader}>
              <Text style={styles.categoryHeaderLabel}>
                <Text style={styles.categoryHeaderIcon}>{category.icon}</Text>{" "}
                {category.name}
              </Text>
              <View style={styles.categoryHeaderTags}>
                {category.tags
                  .slice(0, category.name === "Cuisine" ? 4 : 3)
                  .map(({ tag, count }) => {
                    const isCuisine = category.name === "Cuisine";
                    const flag = isCuisine ? getCuisineFlag(tag) : "";
                    const isSelected = selectedTags.includes(tag.toLowerCase());

                    // Truncate cuisine names for better UI
                    let displayTag = formatTagName(tag);
                    if (isCuisine && displayTag.length > 8) {
                      displayTag = displayTag.substring(0, 8) + "...";
                    }

                    return (
                      <TouchableOpacity
                        key={tag}
                        style={[
                          styles.headerTag,
                          { borderColor: category.color + "40" },
                          isSelected && {
                            backgroundColor: category.color,
                            borderColor: category.color,
                          },
                        ]}
                        onPress={() => handleTagPress(tag)}
                        activeOpacity={0.7}
                      >
                        {flag && (
                          <Text style={styles.headerTagFlag}>{flag}</Text>
                        )}
                        <Text
                          style={[
                            styles.headerTagText,
                            {
                              color: isSelected ? colors.white : category.color,
                            },
                          ]}
                        >
                          {displayTag}
                        </Text>
                        <Text
                          style={[
                            styles.headerTagCount,
                            {
                              color: isSelected
                                ? colors.white + "CC"
                                : category.color + "AA",
                            },
                          ]}
                        >
                          {count}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                {category.tags.length >
                  (category.name === "Cuisine" ? 4 : 3) && (
                  <Text
                    style={[
                      styles.moreTagsIndicator,
                      { color: category.color },
                    ]}
                  >
                    +
                    {category.tags.length -
                      (category.name === "Cuisine" ? 4 : 3)}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

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

      {/* Tags Overview Header */}
      {renderTagsHeader()}

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
  tagsHeaderContainer: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  tagsHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.dark,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  tagsHeaderScroll: {
    paddingHorizontal: spacing.md,
  },
  categoryHeader: {
    marginRight: spacing.lg,
    minWidth: 120,
  },
  categoryHeaderLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.gray[600],
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  categoryHeaderIcon: {
    fontSize: 12,
  },
  categoryHeaderTags: {
    gap: spacing.xs,
  },
  headerTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: colors.white,
    gap: 2,
    marginBottom: spacing.xs,
  },
  headerTagFlag: {
    fontSize: 10,
  },
  headerTagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  headerTagCount: {
    fontSize: 10,
    fontWeight: "500",
  },
  moreTagsIndicator: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
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
