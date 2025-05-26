import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRecipes } from "@/context/RecipeContext";
import { Recipe, Ingredient } from "@/types";
import {
  colors,
  spacing,
  borderRadius,
  typography,
  createShadow,
} from "@/utils/styleUtils";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { validateRecipe, ValidationErrors } from "@/utils/recipeValidation";

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
  const router = useRouter();
  const { recipes, updateRecipe } = useRecipes();

  const [state, setState] = useState<EditState>({
    recipe: {} as Recipe,
    originalRecipe: {} as Recipe,
    isDirty: false,
    isSaving: false,
    isLoading: true,
    errors: {},
    lastSaved: null,
  });

  // Initialize recipe data
  useEffect(() => {
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) {
      Alert.alert("Error", "Recipe not found", [
        { text: "OK", onPress: () => router.back() },
      ]);
      return;
    }

    setState((prev) => ({
      ...prev,
      recipe: { ...recipe },
      originalRecipe: { ...recipe },
      isLoading: false,
    }));
  }, [id, recipes]);

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

  // Auto-save functionality
  const debouncedSave = useDebouncedCallback(async () => {
    if (state.isDirty && !state.isSaving) {
      await performSave(false); // Silent save
    }
  }, 2000);

  useEffect(() => {
    if (state.isDirty && !state.isLoading) {
      debouncedSave();
    }
  }, [state.recipe, state.isDirty]);

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
      unit: "",
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
      // Validate recipe
      const errors = validateRecipe(state.recipe);
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

      await updateRecipe(state.recipe.id, updatedRecipe);

      setState((prev) => ({
        ...prev,
        recipe: updatedRecipe,
        originalRecipe: { ...updatedRecipe },
        isDirty: false,
        isSaving: false,
        lastSaved: new Date(),
        errors: {},
      }));

      if (showFeedback) {
        Alert.alert("Success", "Recipe saved successfully!");
      }

      return true;
    } catch (error) {
      setState((prev) => ({ ...prev, isSaving: false }));

      if (showFeedback) {
        Alert.alert(
          "Save Error",
          error instanceof Error
            ? error.message
            : "Failed to save recipe. Please try again."
        );
      }

      console.error("Failed to save recipe:", error);
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

  const handleDelete = useCallback(() => {
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
              // Implementation would call deleteRecipe from context
              // await deleteRecipe(state.recipe.id);
              router.back();
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to delete recipe. Please try again."
              );
            }
          },
        },
      ]
    );
  }, [state.recipe.id]);

  if (state.isLoading) {
    return <LoadingOverlay message="Loading recipe..." />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container} edges={["top"]}>
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
      </SafeAreaView>
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
