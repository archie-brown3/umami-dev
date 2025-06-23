import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  BackHandler,
} from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { Recipe, Ingredient } from "@/types";
import {
  colors,
  spacing,
  borderRadius,
  typography,
  createShadow,
} from "@/utils/styleUtils";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import {
  validateRecipeForEdit,
  ValidationErrors,
} from "@/utils/recipeValidation";
import {
  getRecipeWithDetails,
  updateRecipeFromApp,
} from "@/services/recipeService";
import { emitRecipeUpdated } from "@/utils/eventEmitter";
import { useRecipes } from "@/context/RecipeContext";

// Import edit components
import EditHeader from "@/components/recipe/edit/EditHeader";
import ImageEditSection from "@/components/recipe/edit/ImageEditSection";
import BasicInfoCard from "@/components/recipe/edit/BasicInfoCard";
import IngredientsCard from "@/components/recipe/edit/IngredientsCard";
import InstructionsCard from "@/components/recipe/edit/InstructionsCard";
import AdditionalInfoCard from "@/components/recipe/edit/AdditionalInfoCard";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import ErrorBoundary from "@/components/common/ErrorBoundary";

interface EditState {
  recipe: Recipe;
  originalRecipe: Recipe;
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  errors: ValidationErrors;
  lastSaved: Date | null;
}

const RecipeEditScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { removeRecipe } = useRecipes();

  const [state, setState] = useState<EditState>({
    recipe: {} as Recipe,
    originalRecipe: {} as Recipe,
    isDirty: false,
    isSaving: false,
    isLoading: true,
    errors: {},
    lastSaved: null,
  });

  // Initialize recipe data by fetching from database
  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) {
        Alert.alert("Error", "No recipe ID provided", [
          { text: "OK", onPress: () => router.back() },
        ]);
        return;
      }

      try {
        console.log(`[RecipeEditScreen] Fetching recipe with ID: ${id}`);
        const recipe = await getRecipeWithDetails(id);

        if (!recipe) {
          Alert.alert("Error", "Recipe not found", [
            { text: "OK", onPress: () => router.back() },
          ]);
          return;
        }

        console.log(
          `[RecipeEditScreen] Recipe loaded successfully: ${recipe.title}`
        );
        setState((prev) => ({
          ...prev,
          recipe: { ...recipe },
          originalRecipe: { ...recipe },
          isLoading: false,
        }));
      } catch (error) {
        console.error("[RecipeEditScreen] Error fetching recipe:", error);
        Alert.alert("Error", "Failed to load recipe", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    };

    fetchRecipe();
  }, [id]);

  // Handle back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );
    return () => backHandler.remove();
  }, [state.isDirty]);

  const handleBackPress = useCallback((): boolean => {
    if (state.isDirty) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Do you want to save before leaving?",
        [
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
          { text: "Cancel", style: "cancel" },
          { text: "Save", onPress: handleSave },
        ]
      );
      return true;
    }
    return false;
  }, [state.isDirty]);

  // Auto-save functionality - DISABLED to require manual save
  // const debouncedSave = useDebouncedCallback(async () => {
  //   if (state.isDirty && !state.isSaving) {
  //     await performSave(false); // Silent save
  //   }
  // }, 2000);

  // useEffect(() => {
  //   if (state.isDirty && !state.isLoading) {
  //     debouncedSave();
  //   }
  // }, [state.recipe, state.isDirty]);

  const updateRecipeField = useCallback(
    <K extends keyof Recipe>(field: K, value: Recipe[K]) => {
      setState((prev) => {
        const newRecipe = { ...prev.recipe, [field]: value };
        const isDirty =
          JSON.stringify(newRecipe) !== JSON.stringify(prev.originalRecipe);

        // Clear field-specific errors
        const newErrors = { ...prev.errors };
        delete newErrors[field];

        return {
          ...prev,
          recipe: newRecipe,
          isDirty,
          errors: newErrors,
        };
      });
    },
    []
  );

  const addIngredient = useCallback(() => {
    const newIngredient: Ingredient = {
      id: `ingredient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      amount: 1,
      unit: "piece",
    };

    setState((prev) => ({
      ...prev,
      recipe: {
        ...prev.recipe,
        ingredients: [...prev.recipe.ingredients, newIngredient],
      },
      isDirty: true,
    }));
  }, []);

  const updateIngredient = useCallback(
    (index: number, ingredient: Ingredient) => {
      setState((prev) => {
        const newIngredients = [...prev.recipe.ingredients];
        newIngredients[index] = ingredient;

        return {
          ...prev,
          recipe: {
            ...prev.recipe,
            ingredients: newIngredients,
          },
          isDirty: true,
        };
      });
    },
    []
  );

  const removeIngredient = useCallback((index: number) => {
    setState((prev) => {
      const newIngredients = prev.recipe.ingredients.filter(
        (_, i) => i !== index
      );

      return {
        ...prev,
        recipe: {
          ...prev.recipe,
          ingredients: newIngredients,
        },
        isDirty: true,
      };
    });
  }, []);

  const addInstruction = useCallback(() => {
    setState((prev) => ({
      ...prev,
      recipe: {
        ...prev.recipe,
        instructions: [...prev.recipe.instructions, ""],
      },
      isDirty: true,
    }));
  }, []);

  const updateInstruction = useCallback(
    (index: number, instruction: string) => {
      setState((prev) => {
        const newInstructions = [...prev.recipe.instructions];
        newInstructions[index] = instruction;

        return {
          ...prev,
          recipe: {
            ...prev.recipe,
            instructions: newInstructions,
          },
          isDirty: true,
        };
      });
    },
    []
  );

  const removeInstruction = useCallback((index: number) => {
    setState((prev) => {
      const newInstructions = prev.recipe.instructions.filter(
        (_, i) => i !== index
      );

      return {
        ...prev,
        recipe: {
          ...prev.recipe,
          instructions: newInstructions,
        },
        isDirty: true,
      };
    });
  }, []);

  const performSave = async (showFeedback = true): Promise<boolean> => {
    setState((prev) => ({ ...prev, isSaving: true }));

    try {
      console.log(
        `[RecipeEditScreen] Starting save process for recipe: ${state.recipe.title}`
      );
      console.log(
        `[RecipeEditScreen] Recipe has ${
          state.recipe.ingredients?.length || 0
        } ingredients:`
      );
      state.recipe.ingredients?.forEach((ingredient, index) => {
        console.log(
          `[RecipeEditScreen] Ingredient ${index + 1}: ${ingredient.amount} ${
            ingredient.unit
          } ${ingredient.name}`
        );
      });

      // Validate recipe
      const errors = validateRecipeForEdit(state.recipe);
      if (Object.keys(errors).length > 0) {
        setState((prev) => ({ ...prev, errors, isSaving: false }));
        if (showFeedback) {
          Alert.alert(
            "Validation Error",
            "Please fix the errors before saving."
          );
        }
        return false;
      }

      // Update recipe with current timestamp
      const updatedRecipe = {
        ...state.recipe,
        updatedAt: new Date().toISOString(),
      };

      console.log(
        `[RecipeEditScreen] Calling updateRecipeFromApp with recipe:`,
        {
          id: updatedRecipe.id,
          title: updatedRecipe.title,
          ingredientCount: updatedRecipe.ingredients?.length || 0,
          instructionCount: updatedRecipe.instructions?.length || 0,
        }
      );

      // Use the database update function instead of context
      const savedRecipe = await updateRecipeFromApp(updatedRecipe);

      if (!savedRecipe) {
        throw new Error("Failed to save recipe to database");
      }

      console.log(`[RecipeEditScreen] Recipe saved successfully:`, {
        id: savedRecipe.id,
        title: savedRecipe.title,
        ingredientCount: savedRecipe.ingredients?.length || 0,
      });

      setState((prev) => ({
        ...prev,
        recipe: savedRecipe,
        originalRecipe: { ...savedRecipe },
        isDirty: false,
        isSaving: false,
        lastSaved: new Date(),
        errors: {},
      }));

      if (showFeedback) {
        Alert.alert("Success", "Recipe saved successfully!");
      }

      // Emit event to refresh recipes list
      emitRecipeUpdated(savedRecipe);

      return true;
    } catch (error) {
      setState((prev) => ({ ...prev, isSaving: false }));

      console.error("[RecipeEditScreen] Save error:", error);
      if (showFeedback) {
        Alert.alert(
          "Save Error",
          error instanceof Error
            ? error.message
            : "Failed to save recipe. Please try again."
        );
      }

      return false;
    }
  };

  const handleSave = useCallback(async () => {
    const success = await performSave(true);
    if (success) {
      router.back();
    }
  }, []);

  const handleCancel = useCallback(() => {
    if (state.isDirty) {
      Alert.alert(
        "Discard Changes",
        "Are you sure you want to discard your changes?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  }, [state.isDirty]);

  const handleDelete = useCallback(async () => {
    Alert.alert(
      "Delete Recipe",
      "Are you sure you want to delete this recipe? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Use the RecipeContext's removeRecipe function for proper deletion
              await removeRecipe(state.recipe.id);
              Alert.alert("Success", "Recipe deleted successfully.");
              router.replace("/(tabs)/recipes");
            } catch (error) {
              console.error("Error deleting recipe:", error);
              Alert.alert(
                "Error",
                "Failed to delete recipe. Please try again."
              );
            }
          },
        },
      ]
    );
  }, [state.recipe.id, removeRecipe]);

  if (state.isLoading) {
    return <LoadingOverlay message="Loading recipe..." />;
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <EditHeader
            isDirty={state.isDirty}
            isSaving={state.isSaving}
            lastSaved={state.lastSaved}
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={handleDelete}
          />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ImageEditSection
              imageUrl={state.recipe.imageUrl}
              onImageChange={(imageUrl) =>
                updateRecipeField("imageUrl", imageUrl)
              }
              error={state.errors.imageUrl}
            />

            <BasicInfoCard
              recipe={state.recipe}
              onUpdate={updateRecipeField}
              errors={state.errors}
            />

            <IngredientsCard
              ingredients={state.recipe.ingredients}
              onAdd={addIngredient}
              onUpdate={updateIngredient}
              onRemove={removeIngredient}
              error={state.errors.ingredients}
            />

            <InstructionsCard
              instructions={state.recipe.instructions}
              onAdd={addInstruction}
              onUpdate={updateInstruction}
              onRemove={removeInstruction}
              error={state.errors.instructions}
            />

            <AdditionalInfoCard
              recipe={state.recipe}
              onUpdate={updateRecipeField}
              errors={state.errors}
            />

            {/* Bottom padding for better scrolling */}
            <View style={styles.bottomPadding} />
          </ScrollView>

          {state.isSaving && <LoadingOverlay message="Saving..." />}
        </KeyboardAvoidingView>
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});

export default RecipeEditScreen;
