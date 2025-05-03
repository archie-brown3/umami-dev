import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Recipe as DBRecipe, RecipeWithDetails } from "../../types/recipe";

// Define types
export type Recipe = DBRecipe;

interface RecipeContextType {
  recipes: Recipe[];
  loading: boolean;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (updatedRecipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  toggleFavorite: (id: string) => void;
  getRecipeById: (id: string) => Recipe | undefined;
}

// Create the context
const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

// Sample data to start with
const sampleRecipes: Recipe[] = [
  {
    id: "1",
    user_id: "",
    title: "Crispy Parmesan Sweet Potatoes",
    description: "Delicious sweet potatoes coated with parmesan and herbs.",
    image_url: null,
    prep_time: 15,
    cook_time: 35,
    servings: 4,
    category: "Side Dish",
    source: null,
    source_url: null,
    author: null,
    is_favorite: true,
    is_saved: false,
    total_cost: null,
    cost_per_serving: null,
    price_confidence: null,
    instagram_username: null,
    instagram_profile_picture: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    user_id: "",
    title: "Chipotle Chicken Wrap",
    description:
      "Spicy chipotle chicken wrapped in a soft tortilla with fresh vegetables.",
    image_url: null,
    prep_time: 15,
    cook_time: 20,
    servings: 2,
    category: "Main Course",
    source: null,
    source_url: null,
    author: null,
    is_favorite: false,
    is_saved: false,
    total_cost: null,
    cost_per_serving: null,
    price_confidence: null,
    instagram_username: null,
    instagram_profile_picture: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Provider component
export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  // Load recipes from storage when the component mounts
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const storedRecipes = await AsyncStorage.getItem("recipes");
        if (storedRecipes) {
          setRecipes(JSON.parse(storedRecipes));
        } else {
          // If no stored recipes, use sample data
          setRecipes(sampleRecipes);
          // Save sample data to storage
          await AsyncStorage.setItem("recipes", JSON.stringify(sampleRecipes));
        }
      } catch (error) {
        console.error("Failed to load recipes from storage:", error);
        // Fallback to sample data
        setRecipes(sampleRecipes);
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, []);

  // Save recipes to storage whenever they change
  useEffect(() => {
    const saveRecipes = async () => {
      if (!loading) {
        try {
          await AsyncStorage.setItem("recipes", JSON.stringify(recipes));
        } catch (error) {
          console.error("Failed to save recipes to storage:", error);
        }
      }
    };

    saveRecipes();
  }, [recipes, loading]);

  // Add a new recipe
  const addRecipe = (recipe: Recipe) => {
    // Ensure recipe has a unique ID
    const newRecipe = {
      ...recipe,
      id: recipe.id || Date.now().toString(),
    };
    setRecipes((prevRecipes) => [...prevRecipes, newRecipe]);
  };

  // Update an existing recipe
  const updateRecipe = (updatedRecipe: Recipe) => {
    setRecipes((prevRecipes) =>
      prevRecipes.map((recipe) =>
        recipe.id === updatedRecipe.id ? updatedRecipe : recipe
      )
    );
  };

  // Delete a recipe
  const deleteRecipe = (id: string) => {
    setRecipes((prevRecipes) =>
      prevRecipes.filter((recipe) => recipe.id !== id)
    );
  };

  // Toggle favorite status
  const toggleFavorite = (id: string) => {
    setRecipes((prevRecipes) =>
      prevRecipes.map((recipe) =>
        recipe.id === id
          ? { ...recipe, is_favorite: !recipe.is_favorite }
          : recipe
      )
    );
  };

  // Get a recipe by ID
  const getRecipeById = (id: string) => {
    return recipes.find((recipe) => recipe.id === id);
  };

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        loading,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        toggleFavorite,
        getRecipeById,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};

// Custom hook to use the recipe context
export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error("useRecipes must be used within a RecipeProvider");
  }
  return context;
};

export default RecipeContext;
