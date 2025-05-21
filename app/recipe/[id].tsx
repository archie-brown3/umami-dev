import React, { useState, useEffect } from "react";
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
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { colors, spacing, typography, borderRadius } from "@/utils/styleUtils";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Recipe } from "@/types";
import { getRecipeWithDetails } from "@/services/recipeService";
import { supabase } from "@/lib/supabase";

const RETRY_DELAY = 2000; // 2 seconds

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recipeId = Array.isArray(id) ? id[0] : id;

  const fetchRecipeDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        `[RecipeDetailScreen] Fetching details for recipeId: ${recipeId}`
      );
      const details = await getRecipeWithDetails(recipeId as string);
      if (details) {
        setRecipe(details);
        setRetryCount(0); // Reset retry count on success
        console.log(
          "[RecipeDetailScreen] Recipe details fetched:",
          JSON.stringify(details, null, 2).substring(0, 500) + "..."
        );
      } else {
        setError("Recipe not found.");
        console.log(
          `[RecipeDetailScreen] No details found for recipeId: ${recipeId}`
        );
      }
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "An unknown error occurred";
      setError(`Failed to load recipe: ${errorMessage}`);
      console.error("[RecipeDetailScreen] Error fetching recipe details:", e);

      // If it's a network error and we haven't exceeded retries, try again
      if (errorMessage.includes("Network") && retryCount < 3) {
        console.log(`[RecipeDetailScreen] Retrying in ${RETRY_DELAY}ms...`);
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          fetchRecipeDetails();
        }, RETRY_DELAY);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (recipeId) {
      fetchRecipeDetails();
    }
  }, [recipeId]);

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

  // Loading state with retry information
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centeredMessageContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            Loading recipe details...
            {retryCount > 0 && `\nRetry attempt ${retryCount}/3`}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state with retry button
  if (error || !recipe) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centeredMessageContainer}>
          <Text style={styles.errorText}>{error || "Recipe not found"}</Text>
          {retryCount < 3 && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchRecipeDetails}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Calculate total time
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  // Edit handler
  const handleEdit = () => {
    setMenuVisible(false);
    router.push({
      pathname: "/recipe/[id]" as const,
      params: { id: recipeId },
    });
  };

  // Delete handler
  const handleDelete = async () => {
    setMenuVisible(false);
    Alert.alert(
      "Delete Recipe",
      "Are you sure you want to delete this recipe?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const { error: deleteError } = await supabase
                .from("recipes")
                .delete()
                .eq("id", recipeId);

              if (deleteError) {
                throw deleteError;
              }
              Alert.alert("Success", "Recipe deleted successfully.");
              router.replace("/recipes");
            } catch (e) {
              const msg =
                e instanceof Error ? e.message : "Could not delete recipe.";
              Alert.alert("Error", msg);
              console.error("Error deleting recipe:", msg);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (deleting) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centeredMessageContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Deleting recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons
              name={recipe.isFavorite ? "heart" : "heart-outline"}
              size={24}
              color={recipe.isFavorite ? colors.red[500] : "#000"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginLeft: 12, padding: 4 }}
            onPress={() => setMenuVisible(true)}
            accessibilityLabel="More options"
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal for menu */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)" }}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={{
              position: "absolute",
              top: 60,
              right: 24,
              backgroundColor: "#fff",
              borderRadius: 12,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 6,
              minWidth: 160,
              paddingVertical: 8,
            }}
          >
            <Pressable
              onPress={handleEdit}
              style={({ pressed }) => [
                {
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor: pressed ? colors.gray[100] : "#fff",
                },
              ]}
            >
              <Text style={{ fontSize: 16, color: colors.dark }}>
                Edit Recipe
              </Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [
                {
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  backgroundColor: pressed ? colors.gray[100] : "#fff",
                },
              ]}
            >
              <Text style={{ fontSize: 16, color: colors.red[500] }}>
                Delete Recipe
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Recipe Image with overlay text */}
        {recipe.imageUrl ? (
          <ImageBackground
            source={{ uri: recipe.imageUrl }}
            style={styles.recipeImage}
            resizeMode="cover"
          >
            {/* Optional: You can add an overlay for text directly on the image if desired */}
            {/* <View style={styles.imageOverlay}>
              <Text style={styles.imageOverlaySubtitle}>{recipe.category || 'Recipe'}</Text>
              <Text style={styles.imageOverlayTitle}>{recipe.title}</Text>
            </View> */}
          </ImageBackground>
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
          <Text style={styles.title}>{recipe.title || "Untitled Recipe"}</Text>
          <Text style={styles.metaText}>
            {totalTime > 0 ? `${totalTime} Mins | ` : ""} {recipe.servings || 1}{" "}
            serving{recipe.servings === 1 ? "" : "s"}
          </Text>
        </View>

        {/* Author Section - Only display if author info exists */}
        {recipe.author && (
          <View style={styles.authorSection}>
            <View style={styles.authorAvatar}>
              {/* You might want to use an Image component here if author has an avatar URL */}
              <Ionicons
                name="person-circle-outline"
                size={32}
                color={colors.gray[500]}
              />
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
          {recipe?.ingredients && recipe.ingredients.length > 0 ? (
            recipe.ingredients.map((ingredient, index) => (
              <View
                key={ingredient.id || index.toString()}
                style={styles.ingredientRow}
              >
                <View style={styles.ingredientCircleIcon}>
                  <Ionicons
                    name={getIconForIngredient(ingredient.name)}
                    size={20}
                    color="#F87171"
                  />
                </View>
                <View style={styles.ingredientTextWrap}>
                  <Text style={styles.ingredientAmountText}>
                    {ingredient.amount} {ingredient.unit}
                  </Text>
                  <Text> </Text>
                  <Text style={styles.ingredientNameText}>
                    {ingredient.name}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No ingredients found</Text>
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {recipe?.instructions && recipe.instructions.length > 0 ? (
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
        <TouchableOpacity
          style={styles.getCookingButton}
          onPress={() =>
            Alert.alert("Get Cooking", "This feature is coming soon!")
          }
        >
          <Text style={styles.buttonText}>Get Cooking</Text>
        </TouchableOpacity>
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
    height: 300,
    justifyContent: "flex-end",
  },
  imagePlaceholder: {
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  imageOverlay: {
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  metaText: {
    fontSize: 15,
    color: colors.gray[600],
  },
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  recipeByText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  authorName: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.dark,
  },
  descriptionContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  description: {
    fontSize: 15,
    color: colors.gray[700],
    lineHeight: 22,
  },
  ingredientsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: spacing.md,
  },
  instructionsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  instructionItem: {
    flexDirection: "row",
    marginBottom: spacing.md,
    alignItems: "flex-start",
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  instructionNumberText: {
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 13,
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: colors.gray[700],
  },
  noDataContainer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  noDataText: {
    color: colors.gray[400],
    fontSize: 15,
    fontStyle: "italic",
  },
  buttonSpacer: {
    height: 120,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  getCookingButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    color: colors.red[500],
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 15,
    color: colors.gray[600],
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  ingredientCircleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  ingredientTextWrap: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  ingredientAmountText: {
    fontWeight: "500",
    color: colors.dark,
    fontSize: 15,
  },
  ingredientNameText: {
    fontWeight: "normal",
    color: colors.gray[800],
    fontSize: 15,
    marginLeft: spacing.xs,
  },
  retryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: typography.fontSizes.md,
    fontWeight: "600",
  },
});
