import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
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
  const { recipes } = useRecipes();
  const { addShoppingItem } = useGroceries();

  // Filter out already selected recipes
  const availableRecipes = recipes.filter(
    (recipe) => !selectedRecipes.some((selected) => selected.id === recipe.id)
  );

  const handleAddRecipeIngredients = (recipe: Recipe) => {
    const missingIngredients = recipe.ingredients.filter((ingredient) => {
      // For now, add all ingredients. Later we can check against cupboard status
      return true;
    });

    if (missingIngredients.length === 0) {
      Alert.alert("No Ingredients", "This recipe has no ingredients to add.");
      return;
    }

    Alert.alert(
      "Add Ingredients",
      `Add ${missingIngredients.length} ingredient${
        missingIngredients.length === 1 ? "" : "s"
      } from "${recipe.title}" to your shopping list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add All",
          onPress: () => {
            missingIngredients.forEach((ingredient) => {
              addShoppingItem({
                name: ingredient.name,
                quantity: ingredient.amount,
                unit: ingredient.unit,
                checked: false,
                recipeId: recipe.id,
              });
            });

            Alert.alert(
              "Added to Shopping List",
              `${missingIngredients.length} ingredient${
                missingIngredients.length === 1 ? "" : "s"
              } added successfully!`
            );
          },
        },
      ]
    );
  };

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
            onPress={() => setShowRecipeSelector(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={colors.dark} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={availableRecipes}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.recipeListItem}
              onPress={() => {
                onAddRecipe(item);
                setShowRecipeSelector(false);
              }}
            >
              <Text style={styles.recipeListTitle}>{item.title}</Text>
              <Text style={styles.recipeListMeta}>
                {item.ingredients.length} ingredients •{" "}
                {(item.prepTime || 0) + (item.cookTime || 0)} min
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.recipeList}
        />
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
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
  },
  subtitle: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
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
});

export default RecipeCarousel;
