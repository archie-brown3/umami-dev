import React, { useState, useEffect, useCallback } from "react";
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
  Dimensions,
  Share,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { colors, spacing, typography, borderRadius } from "@/utils/styleUtils";
import { Ionicons } from "@expo/vector-icons";
import { Recipe } from "@/types";
import { getRecipeWithDetails } from "@/services/recipeService";
import { supabase } from "@/lib/supabase";
import { formatTagName } from "@/services/tagUtils";
import RecipeIngredientRow from "@/components/recipes/RecipeIngredientRow";

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
  const [imageError, setImageError] = useState(false);

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
        console.log(
          `[RecipeDetailScreen] Recipe tags:`,
          JSON.stringify(details.tags, null, 2)
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

  // Loading state with retry information
  if (loading) {
    return (
      <View style={styles.safeArea}>
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
            {retryCount > 0
              ? "Still trying to connect..."
              : "Loading recipe details..."}
          </Text>
          {retryCount > 0 && (
            <Text style={styles.loadingSubText}>
              {`Retry attempt ${retryCount}/3`}
              {retryCount === 3 && "\nLast attempt..."}
            </Text>
          )}
          {retryCount > 1 && (
            <Text style={styles.loadingHelpText}>
              Connectivity issues detected. If this continues, check your
              internet connection or try again later.
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Error state with retry button
  if (error || !recipe) {
    // Special case for network errors
    const isNetworkError =
      error?.includes("Network") ||
      error?.includes("connection") ||
      error?.includes("Unable to connect");

    return (
      <View style={styles.safeArea}>
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
          <Ionicons
            name={
              isNetworkError ? "cloud-offline-outline" : "alert-circle-outline"
            }
            size={48}
            color={colors.red[500]}
          />
          <Text style={styles.errorText}>{error || "Recipe not found"}</Text>
          {isNetworkError && (
            <Text style={styles.errorSubText}>
              This could be due to poor internet connection or the extraction
              service being temporarily unavailable.
            </Text>
          )}
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchRecipeDetails}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          {isNetworkError && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.back()}
            >
              <Text style={styles.secondaryButtonText}>Go Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Calculate total time
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  // Edit handler
  const handleEdit = () => {
    setMenuVisible(false);
    router.push({
      pathname: "/recipe/edit/[id]" as const,
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
      <View style={styles.safeArea}>
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
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
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
        {recipe.imageUrl && !imageError ? (
          <ImageBackground
            source={{ uri: recipe.imageUrl }}
            style={styles.recipeImage}
            resizeMode="cover"
            onError={() => {
              console.log(
                `[RecipeDetail] Image failed to load: ${recipe.imageUrl}`
              );
              setImageError(true);
            }}
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
            {imageError && (
              <Text style={styles.imagePlaceholderText}>
                Image failed to load
              </Text>
            )}
          </View>
        )}

        {/* Recipe Title and Meta */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{recipe.title || "Untitled Recipe"}</Text>
          <Text style={styles.metaText}>
            {totalTime > 0 ? `${totalTime} Mins | ` : ""} {recipe.servings || 1}{" "}
            serving{recipe.servings === 1 ? "" : "s"}
          </Text>

          {/* Recipe Tags */}
          {(() => {
            console.log(`[RecipeDetail] Checking tags:`, recipe.tags);
            return recipe.tags && recipe.tags.length > 0 ? (
              <View style={styles.tagsContainer}>
                {recipe.tags.slice(0, 6).map((tag, index) => (
                  <View key={`${tag}-${index}`} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{formatTagName(tag)}</Text>
                  </View>
                ))}
                {recipe.tags.length > 6 && (
                  <View style={styles.moreTagsChip}>
                    <Text style={styles.moreTagsText}>
                      +{recipe.tags.length - 6} more
                    </Text>
                  </View>
                )}
              </View>
            ) : null;
          })()}
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
              <RecipeIngredientRow
                key={ingredient.id || index.toString()}
                ingredient={ingredient}
                recipeId={recipe.id}
                showStatus={true}
                showAddToShoppingList={true}
              />
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
          onPress={() => router.push(`/cooking/${recipeId}`)}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="flame" size={20} color={colors.white} />
            <Text style={styles.buttonText}>Get Cooking</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.dark,
    letterSpacing: -0.5,
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
  },
  favoriteButton: {
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    marginRight: spacing.xs,
  },
  recipeImage: {
    width: "100%",
    height: 250,
    justifyContent: "flex-end",
  },
  imagePlaceholder: {
    backgroundColor: colors.gray[50],
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
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
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: spacing.sm,
    lineHeight: 32,
  },
  metaText: {
    fontSize: 16,
    color: colors.gray[600],
    fontWeight: "500",
  },
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  recipeByText: {
    fontSize: 14,
    color: colors.gray[500],
    fontWeight: "500",
  },
  authorName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
  },
  descriptionContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 16,
    color: colors.gray[700],
    lineHeight: 24,
    fontStyle: "italic",
  },
  ingredientsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: spacing.lg,
  },
  instructionsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
  },
  instructionItem: {
    flexDirection: "row",
    marginBottom: spacing.lg,
    alignItems: "flex-start",
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
    marginTop: 2,
  },
  instructionNumberText: {
    color: colors.primary[700],
    fontWeight: "700",
    fontSize: 14,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  getCookingButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 16,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
    marginLeft: spacing.md,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: typography.fontSizes.lg,
    textAlign: "center",
    color: colors.red[500],
    marginBottom: spacing.md,
  },
  errorSubText: {
    fontSize: typography.fontSizes.sm,
    textAlign: "center",
    color: colors.gray[600],
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSizes.lg,
    textAlign: "center",
    color: colors.gray[700],
  },
  loadingSubText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSizes.sm,
    textAlign: "center",
    color: colors.gray[600],
  },
  loadingHelpText: {
    marginTop: spacing.lg,
    fontSize: typography.fontSizes.sm,
    textAlign: "center",
    color: colors.gray[600],
    paddingHorizontal: spacing.lg,
  },
  imagePlaceholderText: {
    color: colors.gray[400],
    fontSize: 15,
    fontStyle: "italic",
  },
  tagsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  tagChip: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary[700],
  },
  moreTagsChip: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  moreTagsText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.gray[600],
  },
  retryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: typography.fontSizes.md,
    fontWeight: "600",
  },
  secondaryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.gray[200],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  secondaryButtonText: {
    color: colors.dark,
    fontSize: typography.fontSizes.md,
    fontWeight: "600",
  },
});
