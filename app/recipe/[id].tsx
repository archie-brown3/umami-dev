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
  SafeAreaView,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { colors, spacing, typography, borderRadius } from "@/utils/styleUtils";
import { Ionicons } from "@expo/vector-icons";
import { Recipe } from "@/types";
import {
  formatTagName,
  getTagCategoryColor,
  categorizeTag,
  TAG_CATEGORIES,
} from "@/services/tagUtils";
import RecipeIngredientRow from "@/components/recipes/RecipeIngredientRow";
import ServingScaler from "@/components/recipes/ServingScaler";
import { scaleIngredientAmount, isRecipeScaled } from "@/utils/recipeScaling";
import { useGroceries } from "@/context/GroceriesContext";
import { useRecipes } from "@/context/RecipeContext";
import { emitRecipeUpdated } from "@/utils/eventEmitter";

const RETRY_DELAY = 2000; // 2 seconds

export default function RecipeDetailScreen() {
  const params = useLocalSearchParams();
  const recipeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { width } = useWindowDimensions();
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [currentServings, setCurrentServings] = useState<number>(4); // Default to 4 servings
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const { addItemToShoppingList } = useGroceries();
  const { updateRecipe, removeRecipe, getRecipeById } = useRecipes();

  const fetchRecipeDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log(
        `[RecipeDetailScreen] Fetching details for recipeId: ${recipeId}`
      );
      const details = getRecipeById(recipeId as string);
      if (details) {
        setRecipe(details);
        setCurrentServings(details.servings || 4); // Set current servings to recipe's original servings
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (recipeId) {
      fetchRecipeDetails();
    }
  }, [recipeId]);

  // Loading state with retry information
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
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
      </SafeAreaView>
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
      <SafeAreaView style={styles.safeArea}>
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
      </SafeAreaView>
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
              // Use the RecipeContext's removeRecipe function for proper deletion
              await removeRecipe(recipeId as string);

              Alert.alert("Success", "Recipe deleted successfully.");
              router.replace("/(tabs)/recipes");
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

  // Handle favorite toggle
  const handleToggleFavorite = async () => {
    if (!recipe || isTogglingFavorite) return;

    setIsTogglingFavorite(true);
    try {
      const newFavoriteStatus = !recipe.isFavorite;

      // Update local state
      setRecipe((prev) =>
        prev ? { ...prev, isFavorite: newFavoriteStatus } : null
      );

      // Update recipe in context
      await updateRecipe(recipeId as string, { isFavorite: newFavoriteStatus });

      // Provide user feedback
      Alert.alert(
        "Success",
        newFavoriteStatus ? "Added to favorites!" : "Removed from favorites"
      );

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Emit recipe updated event
      emitRecipeUpdated(recipeId as string);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      Alert.alert(
        "Error",
        "Failed to update favorite status. Please try again."
      );
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  if (deleting) {
    return (
      <SafeAreaView style={styles.safeArea}>
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
    <SafeAreaView style={styles.safeArea}>
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
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={async () => {
              try {
                await Share.share({
                  message: `Check out this recipe: ${recipe.title}`,
                  title: recipe.title,
                });
              } catch (error) {
                console.error("Error sharing recipe:", error);
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={22} color={colors.dark} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleToggleFavorite}
            activeOpacity={0.7}
            disabled={isTogglingFavorite}
          >
            {isTogglingFavorite ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons
                name={recipe.isFavorite ? "heart" : "heart-outline"}
                size={22}
                color={recipe.isFavorite ? colors.red[500] : colors.dark}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setMenuVisible(true)}
            accessibilityLabel="More options"
            activeOpacity={0.7}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={22}
              color={colors.dark}
            />
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

      {/* Tags Modal */}
      <Modal
        visible={showAllTags}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAllTags(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.tagsModal}>
            <View style={styles.tagsModalHeader}>
              <Text style={styles.tagsModalTitle}>
                All Tags ({recipe?.tags?.length || 0})
              </Text>
              <TouchableOpacity
                style={styles.tagsModalClose}
                onPress={() => setShowAllTags(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.tagsModalContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.allTagsGrid}>
                {recipe?.tags?.map((tag, index) => {
                  const categoryColor = getTagCategoryColor(tag);
                  return (
                    <View
                      key={`${tag}-${index}`}
                      style={[
                        styles.tagChipLarge,
                        {
                          backgroundColor: categoryColor + "20",
                          borderColor: categoryColor + "40",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagChipTextLarge,
                          { color: categoryColor },
                        ]}
                      >
                        {formatTagName(tag)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
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

          {/* Servings with +/- controls */}
          <View style={styles.servingsContainer}>
            <Text style={styles.metaText}>
              {totalTime > 0 ? `${totalTime} Mins | ` : ""}
            </Text>
            <TouchableOpacity
              style={styles.servingButton}
              onPress={() =>
                setCurrentServings(Math.max(1, currentServings - 1))
              }
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={16} color={colors.primary[600]} />
            </TouchableOpacity>
            <Text style={styles.servingsText}>
              {currentServings} serving{currentServings === 1 ? "" : "s"}
            </Text>
            <TouchableOpacity
              style={styles.servingButton}
              onPress={() => setCurrentServings(currentServings + 1)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>

          {/* Compact Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <View style={styles.compactTagsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagsScrollContent}
              >
                {recipe.tags.slice(0, 8).map((tag, index) => {
                  const categoryColor = getTagCategoryColor(tag);
                  return (
                    <View
                      key={`${tag}-${index}`}
                      style={[
                        styles.compactTagChip,
                        {
                          backgroundColor: categoryColor + "15",
                          borderColor: categoryColor + "30",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.compactTagText,
                          { color: categoryColor },
                        ]}
                      >
                        {formatTagName(tag)}
                      </Text>
                    </View>
                  );
                })}
                {recipe.tags.length > 8 && (
                  <TouchableOpacity
                    style={styles.moreTagsChip}
                    onPress={() => setShowAllTags(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.moreTagsText}>
                      +{recipe.tags.length - 8}
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          )}
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
          <View style={styles.sectionHeaderWithButton}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe?.ingredients && recipe.ingredients.length > 0 && (
              <TouchableOpacity
                style={styles.compactAddAllButton}
                onPress={async () => {
                  try {
                    // Provide immediate haptic feedback
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

                    // Prepare all ingredients for batch addition
                    const ingredientsToAdd = recipe.ingredients.map(
                      (ingredient) => {
                        const scaledAmount = scaleIngredientAmount(
                          ingredient.amount,
                          recipe.servings || 4,
                          currentServings
                        );

                        return {
                          name: ingredient.name,
                          quantity: scaledAmount.toString(),
                          unit: ingredient.unit || "",
                          category: "Ingredients",
                          checked: false,
                          recipe_id: recipe.id,
                        };
                      }
                    );

                    // Add all ingredients at once using Promise.allSettled for speed
                    const results = await Promise.allSettled(
                      ingredientsToAdd.map((item) =>
                        addItemToShoppingList(item)
                      )
                    );

                    // Count successful additions
                    const addedCount = results.filter(
                      (result) => result.status === "fulfilled"
                    ).length;
                    const errors = results
                      .filter((result) => result.status === "rejected")
                      .map((_, index) => ingredientsToAdd[index].name);

                    // Provide immediate success haptic feedback
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success
                    );

                    // Show success/error message
                    if (errors.length === 0) {
                      Alert.alert(
                        "🛒 All Added!",
                        `Successfully added all ${addedCount} ingredients to your shopping list.`,
                        [
                          {
                            text: "View Shopping List",
                            onPress: () => router.push("/(tabs)/groceries"),
                          },
                          { text: "Continue", style: "cancel" },
                        ]
                      );
                    } else {
                      Alert.alert(
                        "Partially Added",
                        `Added ${addedCount} ingredients successfully. Failed to add: ${errors.join(
                          ", "
                        )}`,
                        [{ text: "OK" }]
                      );
                    }
                  } catch (error) {
                    console.error("Error adding all ingredients:", error);
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Error
                    );
                    Alert.alert(
                      "Error",
                      "Failed to add ingredients to shopping list. Please try again.",
                      [{ text: "OK" }]
                    );
                  }
                }}
              >
                <Ionicons name="basket" size={16} color={colors.white} />
                <Text style={styles.compactAddAllButtonText}>
                  Add All ({recipe.ingredients.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {recipe?.ingredients && recipe.ingredients.length > 0 ? (
            recipe.ingredients.map((ingredient, index) => {
              const scaledAmount = scaleIngredientAmount(
                ingredient.amount,
                recipe.servings || 4,
                currentServings
              );

              return (
                <RecipeIngredientRow
                  key={ingredient.id || index.toString()}
                  ingredient={ingredient}
                  recipeId={recipe.id}
                  showStatus={true}
                  showAddToShoppingList={true}
                  scaledAmount={scaledAmount}
                  isScaled={false} // Remove visual feedback
                />
              );
            })
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

      {/* Get Cooking Button - Made more visible */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.getCookingButton}
          onPress={() => router.push(`/cooking/${recipeId}`)}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="flame" size={24} color={colors.black} />
            <Text style={[styles.buttonText, { color: colors.black }]}>
              Start Cooking
            </Text>
          </View>
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
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  servingsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  servingButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[100],
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: spacing.sm,
  },
  servingsText: {
    fontSize: 16,
    color: colors.gray[600],
    fontWeight: "500",
    minWidth: 80,
    textAlign: "center",
  },
  compactTagsContainer: {
    marginTop: spacing.md,
  },
  tagsScrollContent: {
    paddingRight: spacing.lg,
  },
  compactTagChip: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[200],
    marginRight: spacing.xs,
  },
  compactTagText: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.primary[700],
  },
  moreTagsChip: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginRight: spacing.xs,
  },
  moreTagsText: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.gray[600],
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
  sectionHeaderWithButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.dark,
  },
  compactAddAllButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  compactAddAllButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
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
    height: 100,
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  getCookingButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 20,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
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
    display: "none", // Hide the old categorized tags
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[50],
  },
  tagsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.md,
  },
  tagsHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.dark,
  },
  tagsHeaderAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary[600],
  },
  tagsGrid: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  tagsModal: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    maxWidth: Dimensions.get("window").width * 0.9,
    maxHeight: Dimensions.get("window").height * 0.9,
  },
  tagsModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.md,
  },
  tagsModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.dark,
  },
  tagsModalClose: {
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
  },
  tagsModalContent: {
    flex: 1,
  },
  allTagsGrid: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tagChipLarge: {
    padding: spacing.sm,
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderRadius: 20,
  },
  tagChipTextLarge: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary[700],
  },
  tagCategorySection: {
    marginBottom: spacing.lg,
  },
  tagCategoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  tagCategoryIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  tagCategoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[600],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
