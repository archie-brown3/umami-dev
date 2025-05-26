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
  selectedRecipes: Recipe[];
  onAddRecipe: (recipe: Recipe) => void;
  onRemoveRecipe: (recipeId: string) => void;
}

const RecipeCarousel: React.FC<RecipeCarouselProps> = ({
  selectedRecipes,
  onAddRecipe,
  onRemoveRecipe,
}) => {
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { recipes } = useRecipes();
  const {
    selectedRecipes: groceriesSelectedRecipes,
    addSelectedRecipe,
    removeSelectedRecipe,
    addRecipeToShoppingList,
    recipesWithIngredients,
    loadRecipesWithIngredients,
  } = useGroceries();

  // Load recipes with ingredients when component mounts
  useEffect(() => {
    loadRecipesWithIngredients();
  }, []);

  // Use recipes with ingredients for the shopping list view
  const availableRecipes = recipesWithIngredients.filter(
    (recipe) => !selectedRecipes.some((selected) => selected.id === recipe.id)
  );

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

  const handleAddRecipeIngredients = (recipe: Recipe) => {
    if (recipe.ingredients.length === 0) {
      Alert.alert("No Ingredients", "This recipe has no ingredients to add.");
      return;
    }

    Alert.alert(
      "Add Ingredients",
      `Add ${recipe.ingredients.length} ingredient${
        recipe.ingredients.length === 1 ? "" : "s"
      } from "${recipe.title}" to your shopping list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add All",
          onPress: async () => {
            try {
              await addRecipeToShoppingList(recipe);
              Alert.alert(
                "Added to Shopping List",
                `${recipe.ingredients.length} ingredient${
                  recipe.ingredients.length === 1 ? "" : "s"
                } added successfully!`
              );
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to add ingredients to shopping list"
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
      onPress={() => {
        onAddRecipe(item);
        setShowRecipeSelector(false);
        setSearchQuery("");
        setSelectedTags([]);
      }}
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
        <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
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
          <Text style={styles.modalTitle}>Select Recipes</Text>
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

  if (selectedRecipes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Recipe Ingredients</Text>
          <Text style={styles.subtitle}>
            Add recipes to quickly build your shopping list
          </Text>
        </View>

        <View style={styles.emptyState}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowRecipeSelector(true)}
          >
            <Ionicons name="add" size={24} color={colors.primary} />
            <Text style={styles.addButtonText}>Add Recipe</Text>
          </TouchableOpacity>
        </View>

        {renderRecipeSelector()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recipe Ingredients</Text>
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
        {selectedRecipes.map((recipe) => (
          <CompactRecipeCard
            key={recipe.id}
            recipe={recipe}
            onPress={() => handleAddRecipeIngredients(recipe)}
            onDelete={() => onRemoveRecipe(recipe.id)}
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: "dashed",
  },
  addButtonText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary,
  },
  addSmallButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  carousel: {
    paddingHorizontal: spacing.lg,
  },
  addCardButton: {
    width: 140,
    height: 130, // Match CompactRecipeCard total height
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addCardText: {
    fontSize: 12,
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
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
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
});

export default RecipeCarousel;
