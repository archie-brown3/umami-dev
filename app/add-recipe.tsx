import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { Recipe, RecipeStep, RecipeIngredient } from "../types/recipe";

interface NewRecipe {
  title: string;
  prep_time: string;
  cook_time: string;
  servings: string;
  description: string;
  ingredients: { quantity: string; unit: string; name: string }[];
  steps: { instruction: string }[];
}

export default function AddRecipeScreen() {
  const [recipe, setRecipe] = useState<NewRecipe>({
    title: "",
    prep_time: "",
    cook_time: "",
    servings: "",
    description: "",
    ingredients: [{ quantity: "", unit: "", name: "" }],
    steps: [{ instruction: "" }],
  });

  const handleIngredientChange = (
    text: string,
    index: number,
    field: "quantity" | "unit" | "name"
  ) => {
    const newIngredients = [...recipe.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: text };
    setRecipe({ ...recipe, ingredients: newIngredients });
  };

  const addIngredient = () => {
    setRecipe({
      ...recipe,
      ingredients: [
        ...recipe.ingredients,
        { quantity: "", unit: "", name: "" },
      ],
    });
  };

  const removeIngredient = (index: number) => {
    if (recipe.ingredients.length > 1) {
      const newIngredients = [...recipe.ingredients];
      newIngredients.splice(index, 1);
      setRecipe({ ...recipe, ingredients: newIngredients });
    }
  };

  const handleStepChange = (text: string, index: number) => {
    const newSteps = [...recipe.steps];
    newSteps[index] = { instruction: text };
    setRecipe({ ...recipe, steps: newSteps });
  };

  const addStep = () => {
    setRecipe({
      ...recipe,
      steps: [...recipe.steps, { instruction: "" }],
    });
  };

  const removeStep = (index: number) => {
    if (recipe.steps.length > 1) {
      const newSteps = [...recipe.steps];
      newSteps.splice(index, 1);
      setRecipe({ ...recipe, steps: newSteps });
    }
  };

  const handleSave = async () => {
    try {
      // Basic validation
      if (!recipe.title.trim()) {
        Alert.alert("Error", "Please enter a recipe title");
        return;
      }

      // Create the recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
        .insert([
          {
            title: recipe.title,
            description: recipe.description,
            prep_time: parseInt(recipe.prep_time) || 0,
            cook_time: parseInt(recipe.cook_time) || 0,
            servings: parseInt(recipe.servings) || 1,
            category: "Other",
            is_favorite: false,
            is_saved: true,
          },
        ])
        .select()
        .single();

      if (recipeError) throw recipeError;
      if (!recipeData) throw new Error("No recipe data returned");

      // Add steps
      const steps = recipe.steps.map((step, index) => ({
        recipe_id: recipeData.id,
        instruction: step.instruction,
        step_number: index + 1,
      }));

      const { error: stepsError } = await supabase
        .from("recipe_steps")
        .insert(steps);

      if (stepsError) throw stepsError;

      // Add ingredients
      // First, create any new ingredients
      const ingredientPromises = recipe.ingredients.map(async (ingredient) => {
        const { data: existingIngredient } = await supabase
          .from("ingredients")
          .select("id")
          .eq("name", ingredient.name)
          .single();

        if (existingIngredient) {
          return existingIngredient.id;
        }

        const { data: newIngredient, error: ingredientError } = await supabase
          .from("ingredients")
          .insert([
            {
              name: ingredient.name,
              category: "Other",
            },
          ])
          .select()
          .single();

        if (ingredientError) throw ingredientError;
        return newIngredient.id;
      });

      const ingredientIds = await Promise.all(ingredientPromises);

      // Then create recipe_ingredients
      const recipeIngredients = recipe.ingredients.map((ingredient, index) => ({
        recipe_id: recipeData.id,
        ingredient_id: ingredientIds[index],
        quantity: ingredient.quantity,
        unit: ingredient.unit,
      }));

      const { error: ingredientsError } = await supabase
        .from("recipe_ingredients")
        .insert(recipeIngredients);

      if (ingredientsError) throw ingredientsError;

      Alert.alert("Success", "Recipe saved successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error saving recipe:", error);
      Alert.alert("Error", "Failed to save recipe. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.label}>Recipe Name</Text>
          <TextInput
            style={styles.input}
            value={recipe.title}
            onChangeText={(text) => setRecipe({ ...recipe, title: text })}
            placeholder="Enter recipe name"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={recipe.description}
            onChangeText={(text) => setRecipe({ ...recipe, description: text })}
            placeholder="Enter recipe description"
            multiline
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>Prep Time (min)</Text>
            <TextInput
              style={styles.input}
              value={recipe.prep_time}
              onChangeText={(text) => setRecipe({ ...recipe, prep_time: text })}
              placeholder="0"
              keyboardType="number-pad"
            />
          </View>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.label}>Cook Time (min)</Text>
            <TextInput
              style={styles.input}
              value={recipe.cook_time}
              onChangeText={(text) => setRecipe({ ...recipe, cook_time: text })}
              placeholder="0"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Servings</Text>
          <TextInput
            style={styles.input}
            value={recipe.servings}
            onChangeText={(text) => setRecipe({ ...recipe, servings: text })}
            placeholder="1"
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Ingredients</Text>
            <TouchableOpacity onPress={addIngredient} style={styles.addButton}>
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {recipe.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientContainer}>
              <TextInput
                style={[styles.input, styles.quantityInput]}
                value={ingredient.quantity}
                onChangeText={(text) =>
                  handleIngredientChange(text, index, "quantity")
                }
                placeholder="Amount"
              />
              <TextInput
                style={[styles.input, styles.unitInput]}
                value={ingredient.unit}
                onChangeText={(text) =>
                  handleIngredientChange(text, index, "unit")
                }
                placeholder="Unit"
              />
              <TextInput
                style={[styles.input, styles.ingredientInput]}
                value={ingredient.name}
                onChangeText={(text) =>
                  handleIngredientChange(text, index, "name")
                }
                placeholder="Ingredient"
              />
              {recipe.ingredients.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeIngredient(index)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close" size={20} color="#E57373" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Instructions</Text>
            <TouchableOpacity onPress={addStep} style={styles.addButton}>
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {recipe.steps.map((step, index) => (
            <View key={index} style={styles.listItemContainer}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>{index + 1}</Text>
              </View>
              <TextInput
                style={[styles.input, styles.listItemInput]}
                value={step.instruction}
                onChangeText={(text) => handleStepChange(text, index)}
                placeholder={`Step ${index + 1}`}
                multiline
              />
              {recipe.steps.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeStep(index)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close" size={20} color="#E57373" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Recipe</Text>
        </TouchableOpacity>

        {/* Add extra space at bottom for keyboard */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  notesInput: {
    height: 100,
    textAlignVertical: "top",
  },
  ingredientContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  quantityInput: {
    flex: 2,
    marginRight: 8,
  },
  unitInput: {
    flex: 2,
    marginRight: 8,
  },
  ingredientInput: {
    flex: 4,
  },
  listItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  listItemInput: {
    flex: 1,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#8AB39F",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  instructionNumberText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#8AB39F",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: "#8AB39F",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
