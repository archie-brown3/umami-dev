import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  user_id: string;
  created_at: string;
}

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (
    recipe: Omit<Recipe, "id" | "user_id" | "created_at">
  ) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  loading: boolean;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadRecipes();
    }
  }, [user]);

  async function loadRecipes() {
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      setRecipes(data);
    } catch (error) {
      console.error("Error loading recipes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function addRecipe(
    recipe: Omit<Recipe, "id" | "user_id" | "created_at">
  ) {
    try {
      const { data, error } = await supabase
        .from("recipes")
        .insert([{ ...recipe, user_id: user?.id }])
        .select()
        .single();

      if (error) throw error;
      setRecipes([...recipes, data]);
    } catch (error) {
      console.error("Error adding recipe:", error);
    }
  }

  async function deleteRecipe(id: string) {
    try {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) throw error;
      setRecipes(recipes.filter((recipe) => recipe.id !== id));
    } catch (error) {
      console.error("Error deleting recipe:", error);
    }
  }

  return (
    <RecipeContext.Provider
      value={{ recipes, addRecipe, deleteRecipe, loading }}
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

export default RecipeProvider;
