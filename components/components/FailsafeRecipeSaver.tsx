import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Recipe } from "../types";
import { useRecipes } from "../context/RecipeContext";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LifeBuoy, Save } from "lucide-react";
import { toast } from "sonner";

interface FailsafeRecipeSaverProps {
  recipeData: Omit<Recipe, "id" | "createdAt">;
  onSaved?: (recipe: Recipe) => void;
  isVisible: boolean;
}

/**
 * Component that provides a fallback option to save a recipe to local storage
 * when the normal database save process fails.
 */
export const FailsafeRecipeSaver: React.FC<FailsafeRecipeSaverProps> = ({
  recipeData,
  onSaved,
  isVisible,
}) => {
  const navigate = useNavigate();
  const { saveRecipeToLocalStorageOnly } = useRecipes();
  const [isLocalSaving, setIsLocalSaving] = useState(false);
  const [savedLocally, setSavedLocally] = useState<Recipe | null>(null);

  // Save to local storage only - This is the only remaining fallback
  const handleLocalSave = async () => {
    if (!recipeData) {
      toast.error("No recipe data available to save locally.");
      return;
    }

    setIsLocalSaving(true);
    try {
      console.log(
        "[FAILSAFE] Attempting to save recipe to local storage only:",
        recipeData.title
      );
      toast.loading("Saving to local storage only...");

      // Use the context function for saving to localStorage
      const localRecipe = await saveRecipeToLocalStorageOnly(recipeData);

      if (localRecipe) {
        console.log(
          "[FAILSAFE] Local storage save successful:",
          localRecipe.id
        );
        toast.dismiss();
        toast.success(
          `Recipe "${localRecipe.title}" saved to local storage only.`
        );
        setSavedLocally(localRecipe);

        // Notify parent component if needed
        if (onSaved) {
          onSaved(localRecipe);
        }
        // Consider whether to navigate automatically or let user decide
        // setTimeout(() => navigate("/recipes"), 1500);
      } else {
        // The saveRecipeToLocalStorageOnly function should ideally handle its own errors/toasts
        console.error("[FAILSAFE] saveRecipeToLocalStorageOnly returned null.");
        toast.dismiss();
        // A generic error might already be shown by the context function
      }
    } catch (error) {
      console.error("[FAILSAFE] Error saving to local storage:", error);
      toast.dismiss();
      toast.error(
        `Local storage save failed: ${error.message || "Unknown error"}`
      );
    } finally {
      setIsLocalSaving(false);
    }
  };

  // If not visible, render nothing
  if (!isVisible) {
    return null;
  }

  // If recipe already saved locally, show success message and offer navigation
  if (savedLocally) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
        <div className="flex items-center text-green-700 mb-2">
          <Save className="w-5 h-5 mr-2" />
          <h3 className="font-medium">Recipe Saved Locally</h3>
        </div>
        <p className="text-green-600 text-sm">
          Your recipe "{savedLocally.title}" has been saved to this browser. It
          will sync when the database connection is restored.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => navigate("/recipes")}
        >
          Go to Recipes
        </Button>
      </div>
    );
  }

  // Render the fallback save UI
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
      <div className="flex items-center text-amber-700 mb-2">
        <AlertTriangle className="w-5 h-5 mr-2" />
        <h3 className="font-medium">Recipe Save Failed</h3>
      </div>

      <p className="text-amber-600 text-sm mb-3">
        We couldn't save your recipe to the database. You can save it locally
        for now.
      </p>

      <div className="space-y-2">
        <Button
          onClick={handleLocalSave}
          variant="secondary"
          className="w-full"
          disabled={isLocalSaving}
        >
          <LifeBuoy className="mr-2 h-4 w-4" />
          {isLocalSaving ? "Saving Locally..." : "Save to Local Storage Only"}
        </Button>
      </div>

      <p className="text-xs text-amber-500 mt-3">
        Note: Local storage saves are only available on this device and browser
        until synced.
      </p>
    </div>
  );
};
