import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  TextInput,
  SectionList,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "../../../utils/styleUtils";
import { Recipe } from "../../../types";
import CompactRecipeCard from "./CompactRecipeCard";
import { useRecipes } from "../../../context/RecipeContext";
import { useGroceries } from "../../../context/GroceriesContext";
import { router } from "expo-router";

interface RecipeCarouselProps {
  // Remove these props as we'll manage recipes internally based on shopping list
  selectedRecipes?: Recipe[];
  onAddRecipe?: (recipe: Recipe) => void;
  onRemoveRecipe?: (recipeId: string) => void;
}

const RecipeCarousel: React.FC<RecipeCarouselProps> = () => {
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { recipes } = useRecipes();
  const {
    defaultShoppingList,
    addRecipeToShoppingList,
    removeRecipeFromShoppingList,
    recipesWithIngredients,
    loadRecipesWithIngredients,
  } = useGroceries();

  // Load recipes with ingredients when component mounts
  useEffect(() => {
    loadRecipesWithIngredients();
  }, []);

  // Get shopping list items
  const shoppingListItems = defaultShoppingList?.items || [];

  // Calculate which recipes have ALL their ingredients in the shopping list
  const recipesInShoppingList = useMemo(() => {
    return recipesWithIngredients.filter((recipe) => {
      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        return false;
      }

      // Check if ALL ingredients from this recipe are in the shopping list
      // Match by ingredient name, regardless of how they were added to the shopping list
      return recipe.ingredients.every((ingredient) => {
        return shoppingListItems.some(
          (shoppingItem) =>
            shoppingItem.name.toLowerCase().trim() ===
            ingredient.name.toLowerCase().trim()
        );
      });
    });
  }, [recipesWithIngredients, shoppingListItems]);

  // Get recipes that are NOT fully in the shopping list (available to add)
  const availableRecipes = useMemo(() => {
    return recipesWithIngredients.filter((recipe) => {
      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        return false;
      }

      // Recipe is available if it's NOT fully in the shopping list
      // Match by ingredient name, regardless of how they were added to the shopping list
      const isFullyInShoppingList = recipe.ingredients.every((ingredient) => {
        return shoppingListItems.some(
          (shoppingItem) =>
            shoppingItem.name.toLowerCase().trim() ===
            ingredient.name.toLowerCase().trim()
        );
      });

      return !isFullyInShoppingList;
    });
  }, [recipesWithIngredients, shoppingListItems]);

  // Get all unique tags for filtering
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    availableRecipes.forEach((recipe) => {
      recipe.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [availableRecipes]);

  // Filter recipes by search and tags
  const filteredRecipes = useMemo(() => {
    let filtered = availableRecipes;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          recipe.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          recipe.ingredients.some((ingredient) =>
            ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((recipe) =>
        selectedTags.some((tag) => recipe.tags?.includes(tag))
      );
    }

    return filtered;
  }, [availableRecipes, searchQuery, selectedTags]);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddRecipeIngredients = async (recipe: Recipe) => {
    if (recipe.ingredients.length === 0) {
      Alert.alert("No Ingredients", "This recipe has no ingredients to add.");
      return;
    }

    try {
      await addRecipeToShoppingList(recipe);
      setShowRecipeSelector(false);
      setSearchQuery("");
      setSelectedTags([]);
      console.log(
        `Added ${recipe.ingredients.length} ingredients from ${recipe.title} to shopping list`
      );
    } catch (error) {
      Alert.alert("Error", "Failed to add ingredients to shopping list");
    }
  };

  const handleRemoveRecipeFromShoppingList = async (recipeId: string) => {
    const recipe = recipesInShoppingList.find((r) => r.id === recipeId);
    if (!recipe) return;

    Alert.alert(
      "Remove Recipe",
      `Remove all ingredients from "${recipe.title}" from your shopping list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeRecipeFromShoppingList(recipeId);
              console.log(
                `Removed all ingredients from ${recipe.title} from shopping list`
              );
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to remove recipe from shopping list"
              );
            }
          },
        },
      ]
    );
  };

  const renderTagFilter = () => (
    <View style={styles.tagFilterContainer}>
      <Text style={styles.filterLabel}>Filter by tags:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagScrollContent}
      >
        {allTags.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.tagChip,
              selectedTags.includes(tag) && styles.tagChipActive,
            ]}
            onPress={() => handleToggleTag(tag)}
          >
            <Text
              style={[
                styles.tagChipText,
                selectedTags.includes(tag) && styles.tagChipTextActive,
              ]}
            >
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeListItem}
      onPress={() => handleAddRecipeIngredients(item)}
    >
      <View style={styles.recipeItemContent}>
        {/* Recipe Thumbnail */}
        <View style={styles.recipeThumbnailContainer}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.recipeThumbnail}
            />
          ) : (
            <View style={[styles.recipeThumbnail, styles.placeholderThumbnail]}>
              <Ionicons
                name="image-outline"
                size={24}
                color={colors.gray[400]}
              />
            </View>
          )}
        </View>

        <View style={styles.recipeItemInfo}>
          <Text style={styles.recipeListTitle}>{item.title}</Text>
          <Text style={styles.recipeListMeta}>
            {item.ingredients.length} ingredients •{" "}
            {(item.prepTime || 0) + (item.cookTime || 0)} min
          </Text>
          {item.description && (
            <Text style={styles.recipeDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.recipeTagsContainer}>
              {item.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.recipeTagBadge}>
                  <Text style={styles.recipeTagText}>{tag}</Text>
                </View>
              ))}
              {item.tags.length > 3 && (
                <Text style={styles.moreTagsText}>
                  +{item.tags.length - 3} more
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Single Add Button */}
        <TouchableOpacity
          style={styles.addRecipeButton}
          onPress={(e) => {
            e.stopPropagation();
            handleAddRecipeIngredients(item);
          }}
        >
          <Ionicons name="cart" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderRecipeSelector = () => (
    <Modal
      visible={showRecipeSelector}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add Recipe to Shopping List</Text>
          <TouchableOpacity
            onPress={() => {
              setShowRecipeSelector(false);
              setSearchQuery("");
              setSelectedTags([]);
            }}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={colors.dark} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes or ingredients..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.gray[400]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.gray[400]}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tag Filter */}
        {allTags.length > 0 && renderTagFilter()}

        {/* Recipe List */}
        {filteredRecipes.length === 0 ? (
          <View style={styles.emptySearchState}>
            <Ionicons name="search" size={48} color={colors.gray[300]} />
            <Text style={styles.emptySearchText}>No recipes found</Text>
            <Text style={styles.emptySearchSubtext}>
              {selectedTags.length > 0 || searchQuery.trim()
                ? "Try adjusting your search or filters"
                : "No recipes available with ingredients"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredRecipes}
            renderItem={renderRecipeItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.recipeList}
          />
        )}
      </View>
    </Modal>
  );

  // Early return for empty state
  if (recipesInShoppingList.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
        >
          {/* Add button - same as when there are recipes */}
          <TouchableOpacity
            style={styles.addCardButton}
            onPress={() => setShowRecipeSelector(true)}
          >
            <Ionicons name="add" size={32} color={colors.gray[400]} />
            <Text style={styles.addCardText}>Add Recipe</Text>
          </TouchableOpacity>
        </ScrollView>

        {renderRecipeSelector()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Recipe Ingredients</Text>
          <Text style={styles.subtitle}>
            {recipesInShoppingList.length} recipe
            {recipesInShoppingList.length !== 1 ? "s" : ""} in shopping list
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addSmallButton}
          onPress={() => setShowRecipeSelector(true)}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
      >
        {recipesInShoppingList.map((recipe) => (
          <CompactRecipeCard
            key={recipe.id}
            recipe={recipe}
            onPress={() => router.push(`/recipe/${recipe.id}`)}
            onDelete={() => handleRemoveRecipeFromShoppingList(recipe.id)}
            showDeleteButton={true}
          />
        ))}

        {/* Add button at the end */}
        <TouchableOpacity
          style={styles.addCardButton}
          onPress={() => setShowRecipeSelector(true)}
        >
          <Ionicons name="add" size={32} color={colors.gray[400]} />
          <Text style={styles.addCardText}>Add Recipe</Text>
        </TouchableOpacity>
      </ScrollView>

      {renderRecipeSelector()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  header: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
  },
  subtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 1,
  },
  selectedRecipesContainer: {
    paddingLeft: spacing.lg,
  },
  selectedRecipesList: {
    paddingRight: spacing.lg,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: "dashed",
  },
  addButtonText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  addSmallButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  carousel: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  addCardButton: {
    width: 120,
    height: 110,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addCardText: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark,
  },
  closeButton: {
    padding: spacing.sm,
  },
  recipeList: {
    padding: spacing.lg,
  },
  recipeListItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  recipeListTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  recipeListMeta: {
    fontSize: 14,
    color: colors.gray[500],
  },
  searchContainer: {
    padding: spacing.lg,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.dark,
  },
  tagFilterContainer: {
    padding: spacing.lg,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  tagScrollContent: {
    paddingHorizontal: spacing.sm,
  },
  tagChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    marginRight: spacing.sm,
  },
  tagChipActive: {
    backgroundColor: colors.primary,
  },
  tagChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.dark,
  },
  tagChipTextActive: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.white,
  },
  emptySearchState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptySearchText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  emptySearchSubtext: {
    fontSize: 14,
    color: colors.gray[500],
  },
  recipeItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recipeItemInfo: {
    flex: 1,
  },
  recipeThumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 4,
    overflow: "hidden",
    marginRight: spacing.md,
  },
  recipeThumbnail: {
    width: "100%",
    height: "100%",
  },
  placeholderThumbnail: {
    backgroundColor: colors.gray[200],
    justifyContent: "center",
    alignItems: "center",
  },
  recipeDescription: {
    fontSize: 14,
    color: colors.gray[500],
  },
  recipeTagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  recipeTagBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  recipeTagText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.white,
  },
  moreTagsText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  addRecipeButton: {
    padding: spacing.sm,
    backgroundColor: colors.primary[100],
    borderRadius: borderRadius.md,
    marginLeft: spacing.sm,
  },
});

export default RecipeCarousel;
