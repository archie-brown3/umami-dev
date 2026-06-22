import React, { createContext, useContext, useState, useCallback } from "react";
import { Recipe, MealPlan, RecipeContextType } from "@/types";
import { generateId } from "@/lib/utils";
import { demoStore } from "@/lib/demoStore";
import { emitRecipeCreated, eventEmitter, EVENTS } from "@/utils/eventEmitter";
import { extractRecipeFromUrl } from "../services/recipeExtractor";

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

interface EnhancedRecipeContextType extends RecipeContextType {
  mealPlan: MealPlanState;
  getRecipeById: (id: string) => Recipe | undefined;
  refreshRecipes: () => Promise<void>;
  isLoading: boolean;
}

const RecipeContext = createContext<EnhancedRecipeContextType | undefined>(
  undefined
);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>(() => demoStore.getRecipes());
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlanState>({ dayMeals: {} });
  const [isLoading, setIsLoading] = useState(false);

  const refreshRecipes = useCallback(async () => {
    setRecipes(demoStore.getRecipes());
  }, []);

  const addRecipe = async (recipeData: Partial<Recipe>): Promise<Recipe> => {
    console.log("[RecipeContext] Adding recipe:", recipeData.title);

    if (recipeData.sourceUrl && !recipeData.ingredients?.length) {
      console.log("[RecipeContext] Extracting recipe from URL with enhanced extractor");
      try {
        const extractedRecipe = await extractRecipeFromUrl(recipeData.sourceUrl);
        const finalRecipe: Recipe = {
          ...extractedRecipe,
          ...recipeData,
          id: extractedRecipe.id,
          title: recipeData.title || extractedRecipe.title,
          description: recipeData.description || extractedRecipe.description,
        };
        const saved = demoStore.addRecipe(finalRecipe);
        setRecipes(demoStore.getRecipes());
        emitRecipeCreated(saved);
        return saved;
      } catch (extractionError) {
        console.error("[RecipeContext] Enhanced extraction failed:", extractionError);
        throw new Error(
          `Failed to extract recipe: ${
            extractionError instanceof Error ? extractionError.message : String(extractionError)
          }`
        );
      }
    }

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

    const saved = demoStore.addRecipe(recipe);
    setRecipes(demoStore.getRecipes());
    emitRecipeCreated(saved);
    return saved;
  };

  const removeRecipe = async (id: string) => {
    console.log(`[RecipeContext] Removing recipe: ${id}`);
    demoStore.removeRecipe(id);
    setRecipes(demoStore.getRecipes());
    const { emitRecipeDeleted } = require("@/utils/eventEmitter");
    emitRecipeDeleted(id);
  };

  const updateRecipe = async (id: string, updates: Partial<Recipe>) => {
    demoStore.updateRecipe(id, updates);
    setRecipes(demoStore.getRecipes());
  };

  const addMealPlan = async (mealPlan: MealPlan) => {
    const newMealPlan = {
      ...mealPlan,
      id: mealPlan.id || generateId(),
    };
    const updatedMealPlans = [...mealPlans, newMealPlan];
    setMealPlans(updatedMealPlans);
  };

  const removeMealPlan = async (id: string) => {
    const updatedMealPlans = mealPlans.filter((plan) => plan.id !== id);
    setMealPlans(updatedMealPlans);
  };

  const updateMealPlan = async (id: string, updates: Partial<MealPlan>) => {
    const updatedMealPlans = mealPlans.map((plan) =>
      plan.id === id ? { ...plan, ...updates } : plan
    );
    setMealPlans(updatedMealPlans);
  };

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

export function useRecipes() {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error("useRecipes must be used within a RecipeProvider");
  }
  return context;
}

export default { RecipeProvider, useRecipes };
