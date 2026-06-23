const { supabase, supabaseAdmin } = require("../config/supabase");

/**
 * Recipe Service
 *
 * Handles all recipe-related database operations using Supabase
 * Converted from TypeScript to Node.js
 */

/**
 * Transform database recipe to API format
 */
function transformRecipeFromDb(dbRecipe) {
  return {
    id: dbRecipe.id,
    title: dbRecipe.title || "Untitled Recipe",
    description: dbRecipe.description || "",
    imageUrl: dbRecipe.image_url || null,
    prepTime: dbRecipe.prep_time || 0,
    cookTime: dbRecipe.cook_time || 0,
    servings: dbRecipe.servings || 1,
    difficulty: dbRecipe.difficulty || "medium",
    sourceUrl: dbRecipe.source_url || null,
    isFavorite: dbRecipe.is_favorite || false,
    isPublic: dbRecipe.is_public || false,
    userId: dbRecipe.user_id,
    createdAt: dbRecipe.created_at,
    updatedAt: dbRecipe.updated_at,
    ingredients:
      dbRecipe.recipe_ingredients?.map((ri) => ({
        amount: ri.amount,
        unit: ri.unit || "",
        name: ri.ingredients?.name || ri.name || "",
      })) || [],
    instructions:
      dbRecipe.recipe_steps?.map((rs) => rs.instruction).filter(Boolean) || [],
    tags:
      dbRecipe.recipe_tags?.map((rt) => rt.tags?.name).filter(Boolean) || [],
  };
}

/**
 * Get user's recipes with pagination and filtering
 */
async function getUserRecipes(userId, options = {}) {
  const {
    page = 1,
    limit = 10,
    search = "",
    tags = "",
    sortBy = "updated_at",
    sortOrder = "desc",
  } = options;

  try {
    console.log(`[RecipeService] Fetching recipes for user: ${userId}`);

    let query = supabase
      .from("recipes")
      .select(
        `
        id, user_id, title, description, image_url, prep_time, cook_time,
        servings, difficulty, source_url, is_favorite, is_public, created_at, updated_at,
        recipe_ingredients (
          amount, unit, name,
          ingredients (name)
        ),
        recipe_steps (
          step_number, instruction
        ),
        recipe_tags (
          tags (name)
        )
      `
      )
      .eq("user_id", userId);

    // Add search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Add sorting
    const ascending = sortOrder === "asc";
    query = query.order(sortBy, { ascending });

    // Add pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("[RecipeService] Error fetching recipes:", error);
      throw error;
    }

    const recipes = data?.map(transformRecipeFromDb) || [];

    // Filter by tags if specified
    let filteredRecipes = recipes;
    if (tags) {
      const tagArray = tags.split(",").map((tag) => tag.trim().toLowerCase());
      filteredRecipes = recipes.filter((recipe) =>
        recipe.tags.some((recipeTag) =>
          tagArray.includes(recipeTag.toLowerCase())
        )
      );
    }

    console.log(`[RecipeService] Found ${filteredRecipes.length} recipes`);

    return {
      recipes: filteredRecipes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || filteredRecipes.length,
        totalPages: Math.ceil((count || filteredRecipes.length) / limit),
      },
    };
  } catch (error) {
    console.error("[RecipeService] Error in getUserRecipes:", error);
    throw error;
  }
}

/**
 * Get a single recipe by ID
 */
async function getRecipeById(recipeId, userId) {
  try {
    console.log(
      `[RecipeService] Fetching recipe: ${recipeId} for user: ${userId}`
    );

    const { data, error } = await supabase
      .from("recipes")
      .select(
        `
        id, user_id, title, description, image_url, prep_time, cook_time,
        servings, difficulty, source_url, is_favorite, is_public, created_at, updated_at,
        recipe_ingredients (
          amount, unit, name,
          ingredients (name)
        ),
        recipe_steps (
          step_number, instruction
        ),
        recipe_tags (
          tags (name)
        )
      `
      )
      .eq("id", recipeId)
      .single();

    if (error) {
      console.error("[RecipeService] Error fetching recipe:", error);
      throw error;
    }

    if (!data) {
      throw new Error("Recipe not found");
    }

    // Check if user has access to this recipe
    if (data.user_id !== userId && !data.is_public) {
      throw new Error("Access denied to this recipe");
    }

    return transformRecipeFromDb(data);
  } catch (error) {
    console.error("[RecipeService] Error in getRecipeById:", error);
    throw error;
  }
}

/**
 * Create a new recipe
 */
async function createRecipe(userId, recipeData) {
  try {
    console.log(`[RecipeService] Creating recipe for user: ${userId}`);

    // Check recipe limit for free users (if subscription logic is needed)
    // This would integrate with RevenueCat or subscription service

    const {
      title,
      description,
      ingredients,
      instructions,
      tags,
      imageUrl,
      sourceUrl,
      cookingTime,
      servings,
      difficulty,
      isPublic,
    } = recipeData;

    // Start a transaction
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        user_id: userId,
        title,
        description,
        image_url: imageUrl,
        source_url: sourceUrl,
        cook_time: cookingTime || 0,
        servings: servings || 1,
        difficulty: difficulty || "medium",
        is_public: isPublic || false,
      })
      .select()
      .single();

    if (recipeError) {
      console.error("[RecipeService] Error creating recipe:", recipeError);
      throw recipeError;
    }

    const recipeId = recipe.id;

    // Add ingredients
    if (ingredients && ingredients.length > 0) {
      const ingredientInserts = ingredients.map((ingredient, index) => ({
        recipe_id: recipeId,
        amount: ingredient.amount,
        unit: ingredient.unit || "",
        name: ingredient.name,
        order_index: index,
      }));

      const { error: ingredientsError } = await supabase
        .from("recipe_ingredients")
        .insert(ingredientInserts);

      if (ingredientsError) {
        console.error(
          "[RecipeService] Error adding ingredients:",
          ingredientsError
        );
        // Clean up recipe if ingredients failed
        await supabase.from("recipes").delete().eq("id", recipeId);
        throw ingredientsError;
      }
    }

    // Add instructions
    if (instructions && instructions.length > 0) {
      const stepInserts = instructions.map((instruction, index) => ({
        recipe_id: recipeId,
        step_number: index + 1,
        instruction,
      }));

      const { error: stepsError } = await supabase
        .from("recipe_steps")
        .insert(stepInserts);

      if (stepsError) {
        console.error("[RecipeService] Error adding steps:", stepsError);
        // Clean up recipe if steps failed
        await supabase.from("recipes").delete().eq("id", recipeId);
        throw stepsError;
      }
    }

    // Add tags
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        // First, ensure tag exists
        const { data: existingTag, error: tagSelectError } = await supabase
          .from("tags")
          .select("id")
          .eq("name", tagName)
          .single();

        let tagId;
        if (tagSelectError || !existingTag) {
          // Create new tag
          const { data: newTag, error: tagInsertError } = await supabase
            .from("tags")
            .insert({ name: tagName })
            .select("id")
            .single();

          if (tagInsertError) {
            console.error(
              "[RecipeService] Error creating tag:",
              tagInsertError
            );
            continue; // Skip this tag but don't fail the whole recipe
          }
          tagId = newTag.id;
        } else {
          tagId = existingTag.id;
        }

        // Link tag to recipe
        const { error: recipeTagError } = await supabase
          .from("recipe_tags")
          .insert({
            recipe_id: recipeId,
            tag_id: tagId,
          });

        if (recipeTagError) {
          console.error(
            "[RecipeService] Error linking tag to recipe:",
            recipeTagError
          );
          // Continue with other tags
        }
      }
    }

    // Fetch the complete recipe with all relations
    const completeRecipe = await getRecipeById(recipeId, userId);

    console.log(`[RecipeService] Recipe created successfully: ${recipeId}`);
    return completeRecipe;
  } catch (error) {
    console.error("[RecipeService] Error in createRecipe:", error);
    throw error;
  }
}

/**
 * Update an existing recipe
 */
async function updateRecipe(recipeId, userId, updateData) {
  try {
    console.log(
      `[RecipeService] Updating recipe: ${recipeId} for user: ${userId}`
    );

    // First verify the recipe belongs to the user
    const existingRecipe = await getRecipeById(recipeId, userId);
    if (existingRecipe.userId !== userId) {
      throw new Error("Access denied: You can only update your own recipes");
    }

    const {
      title,
      description,
      ingredients,
      instructions,
      tags,
      imageUrl,
      sourceUrl,
      cookingTime,
      servings,
      difficulty,
      isPublic,
      isFavorite,
    } = updateData;

    // Update main recipe record
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (imageUrl !== undefined) updateFields.image_url = imageUrl;
    if (sourceUrl !== undefined) updateFields.source_url = sourceUrl;
    if (cookingTime !== undefined) updateFields.cook_time = cookingTime;
    if (servings !== undefined) updateFields.servings = servings;
    if (difficulty !== undefined) updateFields.difficulty = difficulty;
    if (isPublic !== undefined) updateFields.is_public = isPublic;
    if (isFavorite !== undefined) updateFields.is_favorite = isFavorite;

    if (Object.keys(updateFields).length > 0) {
      updateFields.updated_at = new Date().toISOString();

      const { error: recipeError } = await supabase
        .from("recipes")
        .update(updateFields)
        .eq("id", recipeId)
        .eq("user_id", userId);

      if (recipeError) {
        console.error("[RecipeService] Error updating recipe:", recipeError);
        throw recipeError;
      }
    }

    // Update ingredients if provided
    if (ingredients !== undefined) {
      // Delete existing ingredients
      await supabase
        .from("recipe_ingredients")
        .delete()
        .eq("recipe_id", recipeId);

      // Add new ingredients
      if (ingredients.length > 0) {
        const ingredientInserts = ingredients.map((ingredient, index) => ({
          recipe_id: recipeId,
          amount: ingredient.amount,
          unit: ingredient.unit || "",
          name: ingredient.name,
          order_index: index,
        }));

        const { error: ingredientsError } = await supabase
          .from("recipe_ingredients")
          .insert(ingredientInserts);

        if (ingredientsError) {
          console.error(
            "[RecipeService] Error updating ingredients:",
            ingredientsError
          );
          throw ingredientsError;
        }
      }
    }

    // Update instructions if provided
    if (instructions !== undefined) {
      // Delete existing steps
      await supabase.from("recipe_steps").delete().eq("recipe_id", recipeId);

      // Add new steps
      if (instructions.length > 0) {
        const stepInserts = instructions.map((instruction, index) => ({
          recipe_id: recipeId,
          step_number: index + 1,
          instruction,
        }));

        const { error: stepsError } = await supabase
          .from("recipe_steps")
          .insert(stepInserts);

        if (stepsError) {
          console.error("[RecipeService] Error updating steps:", stepsError);
          throw stepsError;
        }
      }
    }

    // Update tags if provided
    if (tags !== undefined) {
      // Delete existing recipe tags
      await supabase.from("recipe_tags").delete().eq("recipe_id", recipeId);

      // Add new tags
      if (tags.length > 0) {
        for (const tagName of tags) {
          // Ensure tag exists
          const { data: existingTag, error: tagSelectError } = await supabase
            .from("tags")
            .select("id")
            .eq("name", tagName)
            .single();

          let tagId;
          if (tagSelectError || !existingTag) {
            const { data: newTag, error: tagInsertError } = await supabase
              .from("tags")
              .insert({ name: tagName })
              .select("id")
              .single();

            if (tagInsertError) {
              console.error(
                "[RecipeService] Error creating tag:",
                tagInsertError
              );
              continue;
            }
            tagId = newTag.id;
          } else {
            tagId = existingTag.id;
          }

          // Link tag to recipe
          await supabase.from("recipe_tags").insert({
            recipe_id: recipeId,
            tag_id: tagId,
          });
        }
      }
    }

    // Return updated recipe
    const updatedRecipe = await getRecipeById(recipeId, userId);
    console.log(`[RecipeService] Recipe updated successfully: ${recipeId}`);
    return updatedRecipe;
  } catch (error) {
    console.error("[RecipeService] Error in updateRecipe:", error);
    throw error;
  }
}

/**
 * Delete a recipe
 */
async function deleteRecipe(recipeId, userId) {
  try {
    console.log(
      `[RecipeService] Deleting recipe: ${recipeId} for user: ${userId}`
    );

    // Verify ownership
    const recipe = await getRecipeById(recipeId, userId);
    if (recipe.userId !== userId) {
      throw new Error("Access denied: You can only delete your own recipes");
    }

    // Delete recipe (cascade should handle related records)
    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipeId)
      .eq("user_id", userId);

    if (error) {
      console.error("[RecipeService] Error deleting recipe:", error);
      throw error;
    }

    console.log(`[RecipeService] Recipe deleted successfully: ${recipeId}`);
    return { success: true, message: "Recipe deleted successfully" };
  } catch (error) {
    console.error("[RecipeService] Error in deleteRecipe:", error);
    throw error;
  }
}

/**
 * Toggle favorite status
 */
async function toggleFavorite(recipeId, userId) {
  try {
    const recipe = await getRecipeById(recipeId, userId);
    const newFavoriteStatus = !recipe.isFavorite;

    const { error } = await supabase
      .from("recipes")
      .update({ is_favorite: newFavoriteStatus })
      .eq("id", recipeId)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return { isFavorite: newFavoriteStatus };
  } catch (error) {
    console.error("[RecipeService] Error toggling favorite:", error);
    throw error;
  }
}

module.exports = {
  getUserRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  toggleFavorite,
};
