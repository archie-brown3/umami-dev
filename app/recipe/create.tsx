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
import { router } from "expo-router";
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
import { supabase } from "@/lib/supabase";
import { addRecipeToSupabase } from "@/services/recipeService";

// Import edit components (reused for create)
import EditHeader from "@/components/recipe/edit/EditHeader";
import ImageEditSection from "@/components/recipe/edit/ImageEditSection";
import BasicInfoCard from "@/components/recipe/edit/BasicInfoCard";
import IngredientsCard from "@/components/recipe/edit/IngredientsCard";
import InstructionsCard from "@/components/recipe/edit/InstructionsCard";
import AdditionalInfoCard from "@/components/recipe/edit/AdditionalInfoCard";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import ErrorBoundary from "@/components/common/ErrorBoundary";

interface CreateState {
  recipe: Recipe;
  isDirty: boolean;
  isSaving: boolean;
  errors: ValidationErrors;
  lastSaved: Date | null;
}

// Create empty recipe template
const createEmptyRecipe = (): Recipe => ({
  id: `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  title: "",
  description: "",
  ingredients: [
    {
      id: `ingredient-${Date.now()}-1`,
      name: "",
      amount: 1,
      unit: "piece",
    },
  ],
  instructions: [""],
  prepTime: 0,
  cookTime: 0,
  servings: 4,
  imageUrl: undefined,
  tags: [],
  category: "",
  cuisine: "",
  difficulty: "Medium",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: "", // Will be set when saving
});

const RecipeCreateScreen: React.FC = () => {
  const { addRecipe } = useRecipes();

  const [state, setState] = useState<CreateState>({
    recipe: createEmptyRecipe(),
    isDirty: false,
    isSaving: false,
    errors: {},
    lastSaved: null,
  });

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
        "Discard Recipe",
        "You have unsaved changes. Do you want to save before leaving?",
        [
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
          { text: "Cancel", style: "cancel" },
          { text: "Save", onPress: () => handleSave() },
        ]
      );
      return true;
    }
    return false;
  }, [state.isDirty]);

  // Auto-save functionality (draft save to local storage)
  const debouncedSave = useDebouncedCallback(async () => {
    if (state.isDirty && !state.isSaving) {
      await saveDraft();
    }
  }, 3000); // Longer delay for create since it's a draft

  useEffect(() => {
    if (state.isDirty) {
      debouncedSave();
    }
  }, [state.recipe, state.isDirty]);

  const updateRecipeField = useCallback(
    <K extends keyof Recipe>(field: K, value: Recipe[K]) => {
      setState((prev) => {
        const newRecipe = { ...prev.recipe, [field]: value };

        // Clear field-specific errors
        const newErrors = { ...prev.errors };
        delete newErrors[field];

        return {
          ...prev,
          recipe: newRecipe,
          isDirty: true,
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

  const saveDraft = async (): Promise<void> => {
    try {
      // Save draft to local storage for recovery
      const draftKey = `recipe-draft-${state.recipe.id}`;
      const draftData = {
        recipe: state.recipe,
        timestamp: new Date().toISOString(),
      };

      // In a real app, you'd use AsyncStorage here
      // await AsyncStorage.setItem(draftKey, JSON.stringify(draftData));

      setState((prev) => ({
        ...prev,
        lastSaved: new Date(),
      }));

      console.log("Draft saved locally");
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  };

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

      // Get the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be logged in to create recipes");
      }

      // Create final recipe with timestamps and user ID
      const finalRecipe = {
        ...state.recipe,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save recipe to database using the service function
      const savedRecipe = await addRecipeToSupabase(finalRecipe, user.id);

      if (!savedRecipe) {
        throw new Error("Failed to save recipe to database");
      }

      // Clear draft from local storage
      const draftKey = `recipe-draft-${state.recipe.id}`;
      // await AsyncStorage.removeItem(draftKey);

      setState((prev) => ({
        ...prev,
        recipe: {
          ...finalRecipe,
          id: savedRecipe.id, // Use the ID from the database
        },
        isDirty: false,
        isSaving: false,
        lastSaved: new Date(),
        errors: {},
      }));

      if (showFeedback) {
        Alert.alert("Success", "Recipe created successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }

      return true;
    } catch (error) {
      setState((prev) => ({ ...prev, isSaving: false }));

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Failed to create recipe:", error);

      if (showFeedback) {
        Alert.alert(
          "Save Error",
          `Failed to create recipe: ${errorMessage}. Please try again.`
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
        "Discard Recipe",
        "Are you sure you want to discard this recipe?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              // Clear draft
              const draftKey = `recipe-draft-${state.recipe.id}`;
              // AsyncStorage.removeItem(draftKey);
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  }, [state.isDirty]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Discard Recipe",
      "Are you sure you want to discard this recipe?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            // Clear draft
            const draftKey = `recipe-draft-${state.recipe.id}`;
            // AsyncStorage.removeItem(draftKey);
            router.back();
          },
        },
      ]
    );
  }, []);

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
            mode="create"
          />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ImageEditSection
              imageUrl={state.recipe.imageUrl}
              onImageChange={(imageUrl: string | undefined) =>
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

          {state.isSaving && <LoadingOverlay message="Creating recipe..." />}
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

export default RecipeCreateScreen;
