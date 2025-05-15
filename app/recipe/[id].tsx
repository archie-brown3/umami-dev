import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  ImageBackground,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useRecipes } from "../context/RecipeContext";
import { colors, spacing } from "../utils/styleUtils";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const { getRecipeById } = useRecipes();
  const { width } = useWindowDimensions();

  // Get recipe details by ID
  const recipeId = Array.isArray(id) ? id[0] : id;
  const recipe = getRecipeById(recipeId as string);

  // Get icon name for ingredient
  const getIconForIngredient = (ingredientName: string) => {
    const lowerName = ingredientName.toLowerCase();
    if (lowerName.includes("sweet potato") || lowerName.includes("potato"))
      return "restaurant-outline";
    if (lowerName.includes("oil") || lowerName.includes("olive"))
      return "water-outline";
    if (lowerName.includes("garlic")) return "flower-outline";
    if (lowerName.includes("italian") || lowerName.includes("seasoning"))
      return "sparkles-outline";
    if (lowerName.includes("pepper")) return "flame-outline";
    if (lowerName.includes("meat") || lowerName.includes("chicken"))
      return "restaurant-outline";
    if (lowerName.includes("tomato")) return "nutrition-outline";
    if (lowerName.includes("broccoli") || lowerName.includes("vegetable"))
      return "leaf-outline";
    if (lowerName.includes("rice") || lowerName.includes("pasta"))
      return "grid-outline";
    if (lowerName.includes("fish") || lowerName.includes("seafood"))
      return "fish-outline";
    if (lowerName.includes("egg")) return "ellipse-outline";
    if (lowerName.includes("cheese") || lowerName.includes("parmesan"))
      return "square-outline";
    if (lowerName.includes("spice") || lowerName.includes("herb"))
      return "sparkles-outline";
    return "restaurant-outline";
  };

  // If recipe not found
  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Recipe not found</Text>
      </View>
    );
  }

  // Calculate total time
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Disable the native header */}
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Recipe Image with overlay text */}
        {recipe.imageUrl ? (
          <ImageBackground
            source={{ uri: recipe.imageUrl }}
            style={styles.recipeImage}
            resizeMode="cover"
          ></ImageBackground>
        ) : (
          <View style={[styles.recipeImage, styles.imagePlaceholder]}>
            <Ionicons
              name="restaurant-outline"
              size={48}
              color={colors.gray[300]}
            />
          </View>
        )}

        {/* Recipe Title and Meta */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {recipe.title || recipe.name || "Untitled Recipe"}
          </Text>
          <Text style={styles.metaText}>
            {totalTime} Mins | {recipe.servings || 1} serving
          </Text>
        </View>

        {/* Author Section - Only display if author info exists */}
        {recipe.author && (
          <View style={styles.authorSection}>
            <View style={styles.authorAvatar}>
              <Ionicons name="person" size={24} color={colors.gray[400]} />
            </View>
            <View>
              <Text style={styles.recipeByText}>Recipe by</Text>
              <Text style={styles.authorName}>{recipe.author}</Text>
            </View>
          </View>
        )}

        {/* Description */}
        {recipe.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>{recipe.description}</Text>
          </View>
        )}

        {/* Ingredients */}
        <View style={styles.ingredientsSection}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.ingredientsScrollContent}
          >
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientCard}>
                  <View style={styles.ingredientIconContainer}>
                    <Ionicons
                      name={getIconForIngredient(ingredient.name)}
                      size={24}
                      color={colors.gray[600]}
                    />
                  </View>
                  <View style={styles.ingredientTextContainer}>
                    <Text style={styles.ingredientName} numberOfLines={1}>
                      {ingredient.name}
                    </Text>
                    <Text style={styles.ingredientAmount} numberOfLines={1}>
                      {ingredient.amount} {ingredient.unit}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No ingredients found</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {recipe.instructions && recipe.instructions.length > 0 ? (
            recipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No instructions found</Text>
            </View>
          )}
        </View>

        {/* Space for floating button */}
        <View style={styles.buttonSpacer} />
      </ScrollView>

      {/* Get Cooking Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.getCookingButton}>
          <Text style={styles.buttonText}>Get Cooking</Text>
        </TouchableOpacity>
        <View style={styles.bottomIndicator} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark,
  },
  backButton: {
    padding: spacing.xs,
  },
  favoriteButton: {
    padding: spacing.xs,
  },
  recipeImage: {
    width: "100%",
    height: 330, // Taller image as shown in the screenshot
    justifyContent: "flex-end",
  },
  imagePlaceholder: {
    backgroundColor: colors.gray[200],
    justifyContent: "center",
    alignItems: "center",
  },
  imageOverlay: {
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: spacing.lg,
  },
  imageOverlaySubtitle: {
    color: colors.white,
    fontSize: 14,
    marginBottom: 4,
  },
  imageOverlayTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "bold",
  },
  titleContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  metaText: {
    fontSize: 16,
    color: colors.gray[500],
  },
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[200],
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  recipeByText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  authorName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
  },
  descriptionContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  description: {
    fontSize: 16,
    color: colors.gray[700],
    lineHeight: 24,
  },
  ingredientsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: spacing.md,
  },
  ingredientsScrollContent: {
    paddingBottom: spacing.md,
  },
  ingredientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.md,
    minWidth: 160,
    maxWidth: 220,
  },
  ingredientIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  ingredientTextContainer: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.dark,
  },
  ingredientAmount: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: 2,
  },
  instructionsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  instructionItem: {
    flexDirection: "row",
    marginBottom: spacing.md,
    alignItems: "flex-start",
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
    marginTop: 2,
  },
  instructionNumberText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 14,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray[700],
  },
  noDataContainer: {
    padding: spacing.md,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    alignItems: "center",
  },
  noDataText: {
    color: colors.gray[500],
    fontSize: 14,
  },
  buttonSpacer: {
    height: 100,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  getCookingButton: {
    backgroundColor: "#1F2937",
    borderRadius: 8,
    padding: spacing.md,
    alignItems: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "600",
  },
  bottomIndicator: {
    width: 60,
    height: 5,
    backgroundColor: colors.gray[300],
    borderRadius: 5,
    alignSelf: "center",
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 50,
    color: colors.gray[500],
  },
});
