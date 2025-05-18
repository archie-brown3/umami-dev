import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Recipe, MealPlan, RecipeContextType } from "@/types";
import { generateId } from "@/lib/lib/utils";

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

// Create context
const RecipeContext = createContext<
  | (RecipeContextType & {
      mealPlan: MealPlanState;
      getRecipeById: (id: string) => Recipe | undefined;
    })
  | undefined
>(undefined);

// Provider component
export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlanState>({ dayMeals: {} });

  // Load data from AsyncStorage on mount
  useEffect(() => {
    loadData();
  }, []);

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

  // Recipe CRUD operations
  const addRecipe = async (recipe: Recipe) => {
    try {
      const newRecipe = {
        ...recipe,
        id: recipe.id || generateId(),
      };

      const updatedRecipes = [...recipes, newRecipe];
      setRecipes(updatedRecipes);
      await AsyncStorage.setItem("recipes", JSON.stringify(updatedRecipes));
      return newRecipe;
    } catch (error) {
      console.error("Error adding recipe:", error);
      throw error;
    }
  };

  const removeRecipe = async (id: string) => {
    try {
      const updatedRecipes = recipes.filter((recipe) => recipe.id !== id);
      setRecipes(updatedRecipes);
      await AsyncStorage.setItem("recipes", JSON.stringify(updatedRecipes));
    } catch (error) {
      console.error("Error removing recipe:", error);
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
