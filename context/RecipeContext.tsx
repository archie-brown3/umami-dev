import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Recipe, MealPlan, RecipeContextType } from "@/types";
import { generateId } from "@/lib/utils";
import { addRecipeToSupabase, getUserRecipes } from "@/services/recipeService";
import { useAuth } from "./AuthContext";
import { emitRecipeCreated, eventEmitter, EVENTS } from "@/utils/eventEmitter";
import { extractRecipeFromUrl } from "../services/recipeExtractor";

// Create a more specific type for daily meal plan structure
interface DayMeals {
  [date: string]: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  };
}

interface MealPlanState {
  dayMeals: DayMeals;
}

// Enhanced context type with refresh functionality
interface EnhancedRecipeContextType extends RecipeContextType {
  mealPlan: MealPlanState;
  getRecipeById: (id: string) => Recipe | undefined;
  refreshRecipes: () => Promise<void>;
  isLoading: boolean;
}

// Create context
const RecipeContext = createContext<EnhancedRecipeContextType | undefined>(
  undefined
);

// Provider component
export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlanState>({ dayMeals: {} });
  const [isLoading, setIsLoading] = useState(false);

  // Get auth context - should be safe since AuthProvider wraps RecipeProvider in _layout.tsx
  const { user } = useAuth();

  // Load data from Supabase when user changes
  useEffect(() => {
    if (user?.id) {
      loadRecipesFromSupabase();
    } else {
      loadData(); // Fallback to AsyncStorage for offline use
    }
  }, [user?.id]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefreshNeeded = () => {
      console.log("[RecipeContext] Refresh event received, reloading recipes");
      if (user?.id) {
        loadRecipesFromSupabase();
      }
    };

    eventEmitter.on(EVENTS.RECIPES_REFRESH_NEEDED, handleRefreshNeeded);

    return () => {
      eventEmitter.off(EVENTS.RECIPES_REFRESH_NEEDED, handleRefreshNeeded);
    };
  }, [user?.id]);

  const loadRecipesFromSupabase = async () => {
    if (!user?.id) {
      console.log("[RecipeContext] No user ID, skipping Supabase load");
      return;
    }

    try {
      setIsLoading(true);
      console.log(
        "[RecipeContext] Loading recipes from Supabase for user:",
        user.id
      );
      const supabaseRecipes = await getUserRecipes(user.id);
      setRecipes(supabaseRecipes);
      console.log(
        "[RecipeContext] Successfully loaded",
        supabaseRecipes.length,
        "recipes from Supabase"
      );
      console.log(
        "[RecipeContext] Recipe titles:",
        supabaseRecipes.map((r) => r.title).join(", ")
      );
    } catch (error) {
      console.error(
        "[RecipeContext] Error loading recipes from Supabase:",
        error
      );
      // Fallback to AsyncStorage
      await loadData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const storedRecipes = await AsyncStorage.getItem("recipes");
      const storedMealPlans = await AsyncStorage.getItem("mealPlans");
      const storedDayMeals = await AsyncStorage.getItem("dayMeals");

      if (storedRecipes) {
        setRecipes(JSON.parse(storedRecipes));
      }

      if (storedMealPlans) {
        setMealPlans(JSON.parse(storedMealPlans));
      }

      if (storedDayMeals) {
        setMealPlan({ dayMeals: JSON.parse(storedDayMeals) });
      }
    } catch (error) {
      console.error("Error loading recipe data:", error);
    }
  };

  // Public refresh function that can be called by components
  const refreshRecipes = async () => {
    console.log("[RecipeContext] Manual refresh requested");
    if (user?.id) {
      await loadRecipesFromSupabase();
    } else {
      await loadData();
    }
  };

  // Recipe CRUD operations
  const addRecipe = async (recipeData: Partial<Recipe>): Promise<Recipe> => {
    try {
      console.log("[RecipeContext] Adding recipe:", recipeData.title);

      // If this is a URL-based recipe, use the enhanced extractor
      if (recipeData.sourceUrl && !recipeData.ingredients?.length) {
        console.log(
          "[RecipeContext] Extracting recipe from URL with enhanced extractor"
        );

        try {
          const extractedRecipe = await extractRecipeFromUrl(
            recipeData.sourceUrl
          );

          // Merge with any provided data
          const finalRecipe: Recipe = {
            ...extractedRecipe,
            ...recipeData,
            id: extractedRecipe.id,
            title: recipeData.title || extractedRecipe.title,
            description: recipeData.description || extractedRecipe.description,
          };

          // Save to Supabase with enhanced data
          if (user?.id) {
            const savedRecipe = await addRecipeToSupabase(finalRecipe, user.id);
            if (savedRecipe) {
              // Refresh recipes from Supabase to get the complete updated list
              await loadRecipesFromSupabase();

              // Find the recipe in the refreshed data
              const refreshedRecipes = await getUserRecipes(user.id);
              const newRecipe = refreshedRecipes.find(
                (r) => r.id === savedRecipe.id
              );

              if (newRecipe) {
                emitRecipeCreated(newRecipe);
                return newRecipe;
              } else {
                // Fallback transformation if not found in refreshed data
                const fallbackRecipe = transformSupabaseToRecipe(
                  savedRecipe,
                  finalRecipe
                );
                emitRecipeCreated(fallbackRecipe);
                return fallbackRecipe;
              }
            } else {
              throw new Error("Failed to save recipe to Supabase");
            }
          } else {
            // Fallback to AsyncStorage if user not authenticated
            const updatedRecipes = [...recipes, finalRecipe];
            setRecipes(updatedRecipes);
            await AsyncStorage.setItem(
              "recipes",
              JSON.stringify(updatedRecipes)
            );
            emitRecipeCreated(finalRecipe);
            return finalRecipe;
          }
        } catch (extractionError) {
          console.error(
            "[RecipeContext] Enhanced extraction failed:",
            extractionError
          );
          throw new Error(
            `Failed to extract recipe: ${
              extractionError instanceof Error
                ? extractionError.message
                : String(extractionError)
            }`
          );
        }
      }

      // For manual recipes or when extraction isn't needed
      const recipe: Recipe = {
        id:
          recipeData.id ||
          `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: recipeData.title || "Untitled Recipe",
        description: recipeData.description || "",
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
        prepTime: recipeData.prepTime || 0,
        cookTime: recipeData.cookTime || 0,
        servings: recipeData.servings || 4,
        imageUrl: recipeData.imageUrl,
        sourceUrl: recipeData.sourceUrl,
        author: recipeData.author,
        tags: recipeData.tags || [],
        createdAt: recipeData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (user?.id) {
        const savedRecipe = await addRecipeToSupabase(recipe, user.id);
        if (savedRecipe) {
          // Refresh recipes from Supabase to get the complete updated list
          await loadRecipesFromSupabase();

          // Find the recipe in the refreshed data
          const refreshedRecipes = await getUserRecipes(user.id);
          const newRecipe = refreshedRecipes.find(
            (r) => r.id === savedRecipe.id
          );

          if (newRecipe) {
            emitRecipeCreated(newRecipe);
            return newRecipe;
          } else {
            // Fallback transformation if not found in refreshed data
            const fallbackRecipe = transformSupabaseToRecipe(
              savedRecipe,
              recipe
            );
            emitRecipeCreated(fallbackRecipe);
            return fallbackRecipe;
          }
        } else {
          throw new Error("Failed to save recipe to Supabase");
        }
      } else {
        // Fallback to AsyncStorage if user not authenticated
        const updatedRecipes = [...recipes, recipe];
        setRecipes(updatedRecipes);
        await AsyncStorage.setItem("recipes", JSON.stringify(updatedRecipes));
        emitRecipeCreated(recipe);
        return recipe;
      }
    } catch (error) {
      console.error("[RecipeContext] Error adding recipe:", error);
      throw error;
    }
  };

  // Helper function to transform Supabase recipe back to Recipe format
  const transformSupabaseToRecipe = (
    savedRecipe: any,
    originalRecipe: Recipe
  ): Recipe => {
    return {
      id: savedRecipe.id,
      title: savedRecipe.title,
      description: savedRecipe.description || "",
      imageUrl: savedRecipe.image_url,
      prepTime: savedRecipe.prep_time || 0,
      cookTime: savedRecipe.cook_time || 0,
      servings: savedRecipe.servings || 1,
      isFavorite: savedRecipe.is_favorite || false,
      createdAt: savedRecipe.created_at,
      updatedAt: savedRecipe.updated_at,
      ingredients: originalRecipe.ingredients || [],
      instructions: originalRecipe.instructions || [],
      tags: originalRecipe.tags || [],
      author: savedRecipe.author,
      sourceUrl: savedRecipe.source_url,
    };
  };

  const removeRecipe = async (id: string) => {
    console.log(`[RecipeContext] Starting recipe deletion: ${id}`);

    try {
      if (user?.id) {
        // Delete from Supabase database using the service function
        const { RecipeService } = require("@/services/recipeService");
        console.log(`[RecipeContext] Deleting recipe ${id} from Supabase`);
        await RecipeService.deleteRecipe(id);

        console.log(
          `[RecipeContext] Recipe ${id} deleted from database, refreshing context`
        );

        // Immediately refresh recipes from Supabase to get updated list
        await loadRecipesFromSupabase();

        console.log(
          `[RecipeContext] Context refreshed, emitting deletion event`
        );

        // Emit deletion event for other parts of the app
        const { emitRecipeDeleted } = require("@/utils/eventEmitter");
        emitRecipeDeleted(id);

        console.log(
          `[RecipeContext] Recipe ${id} successfully deleted and UI updated`
        );
      } else {
        // Fallback to AsyncStorage if no user (offline mode)
        console.log(
          `[RecipeContext] No user, removing recipe ${id} from local storage`
        );
        const updatedRecipes = recipes.filter((recipe) => recipe.id !== id);
        setRecipes(updatedRecipes);
        await AsyncStorage.setItem("recipes", JSON.stringify(updatedRecipes));

        // Still emit the event for local state updates
        const { emitRecipeDeleted } = require("@/utils/eventEmitter");
        emitRecipeDeleted(id);
      }
    } catch (error) {
      console.error(`[RecipeContext] Error removing recipe ${id}:`, error);
      throw error;
    }
  };

  const updateRecipe = async (id: string, updates: Partial<Recipe>) => {
    try {
      const updatedRecipes = recipes.map((recipe) =>
        recipe.id === id ? { ...recipe, ...updates } : recipe
      );
      setRecipes(updatedRecipes);
      await AsyncStorage.setItem("recipes", JSON.stringify(updatedRecipes));
    } catch (error) {
      console.error("Error updating recipe:", error);
      throw error;
    }
  };

  // Meal Plan operations
  const addMealPlan = async (mealPlan: MealPlan) => {
    try {
      const newMealPlan = {
        ...mealPlan,
        id: mealPlan.id || generateId(),
      };

      const updatedMealPlans = [...mealPlans, newMealPlan];
      setMealPlans(updatedMealPlans);
      await AsyncStorage.setItem("mealPlans", JSON.stringify(updatedMealPlans));
    } catch (error) {
      console.error("Error adding meal plan:", error);
      throw error;
    }
  };

  const removeMealPlan = async (id: string) => {
    try {
      const updatedMealPlans = mealPlans.filter((plan) => plan.id !== id);
      setMealPlans(updatedMealPlans);
      await AsyncStorage.setItem("mealPlans", JSON.stringify(updatedMealPlans));
    } catch (error) {
      console.error("Error removing meal plan:", error);
      throw error;
    }
  };

  const updateMealPlan = async (id: string, updates: Partial<MealPlan>) => {
    try {
      const updatedMealPlans = mealPlans.map((plan) =>
        plan.id === id ? { ...plan, ...updates } : plan
      );
      setMealPlans(updatedMealPlans);
      await AsyncStorage.setItem("mealPlans", JSON.stringify(updatedMealPlans));
    } catch (error) {
      console.error("Error updating meal plan:", error);
      throw error;
    }
  };

  // Helper function to get a recipe by ID
  const getRecipeById = (id: string): Recipe | undefined => {
    return recipes.find((recipe) => recipe.id === id);
  };

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        addRecipe,
        removeRecipe,
        updateRecipe,
        mealPlans,
        addMealPlan,
        removeMealPlan,
        updateMealPlan,
        mealPlan,
        getRecipeById,
        refreshRecipes,
        isLoading,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
}

// Custom hook to use recipe context
export function useRecipes() {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error("useRecipes must be used within a RecipeProvider");
  }
  return context;
}

// Default export to satisfy Expo Router
export default { RecipeProvider, useRecipes };
