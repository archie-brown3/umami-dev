import { supabase } from "@/lib/supabase";
import { Recipe } from "@/types";

/**
 * Generate mock tags based on recipe title - same logic as in recipes.tsx
 */
function generateMockTags(recipe: Recipe): string[] {
  const title = recipe.title?.toLowerCase() || "";

  const tags: string[] = [];

  // Protein/Main ingredient tags
  if (title.includes("chicken")) tags.push("protein", "chicken");
  else if (title.includes("beef")) tags.push("protein", "beef");
  else if (
    title.includes("fish") ||
    title.includes("salmon") ||
    title.includes("tuna")
  )
    tags.push("protein", "seafood");
  else if (title.includes("pasta")) tags.push("carbs", "pasta");
  else if (title.includes("rice")) tags.push("carbs", "rice");
  else if (title.includes("salad")) tags.push("healthy", "vegetarian");
  else if (title.includes("soup")) tags.push("comfort", "warm");
  else tags.push("quick");

  // Meal type tags
  if (title.includes("wrap") || title.includes("sandwich")) tags.push("lunch");
  else if (
    title.includes("breakfast") ||
    title.includes("pancake") ||
    title.includes("oats")
  )
    tags.push("breakfast");
  else if (
    title.includes("dessert") ||
    title.includes("sweet") ||
    title.includes("cake") ||
    title.includes("cookie")
  )
    tags.push("dessert");
  else if (title.includes("snack")) tags.push("snack");
  else tags.push("dinner");

  // Difficulty
  tags.push("easy");

  // Cuisine tags
  if (title.includes("thai")) tags.push("thai", "asian");
  else if (title.includes("italian")) tags.push("italian", "european");
  else if (title.includes("mexican")) tags.push("mexican");
  else if (title.includes("chinese")) tags.push("chinese", "asian");
  else if (title.includes("indian")) tags.push("indian", "asian");
  else if (title.includes("mediterranean")) tags.push("mediterranean");
  else tags.push("american");

  // Dietary tags
  if (title.includes("vegan")) tags.push("vegan", "plant-based");
  else if (title.includes("vegetarian") || title.includes("veggie"))
    tags.push("vegetarian");
  if (title.includes("gluten-free")) tags.push("gluten-free");
  if (title.includes("healthy") || title.includes("light"))
    tags.push("healthy");
  if (title.includes("protein") && title.includes("high"))
    tags.push("high-protein");

  // Cooking method tags
  if (title.includes("bake") || title.includes("baked")) tags.push("baked");
  else if (title.includes("grill") || title.includes("grilled"))
    tags.push("grilled");
  else if (title.includes("fry") || title.includes("fried")) tags.push("fried");
  else if (title.includes("roast") || title.includes("roasted"))
    tags.push("roasted");

  // Flavor profile
  if (title.includes("spicy")) tags.push("spicy");
  else if (title.includes("sweet")) tags.push("sweet");

  // Remove duplicates and return
  return [...new Set(tags)];
}

/**
 * Save tags to database for a recipe
 */
async function saveTagsToDatabase(
  recipeId: string,
  tags: string[]
): Promise<void> {
  console.log(
    `[TagMigration] Saving ${tags.length} tags for recipe ${recipeId}:`,
    tags
  );

  for (const tagName of tags) {
    try {
      if (!tagName || !tagName.trim()) continue;

      const normalizedTagName = tagName.trim().toLowerCase();

      // First, create or get the tag in the tags table
      const { data: existingTag, error: findError } = await supabase
        .from("tags")
        .select("id")
        .eq("name", normalizedTagName)
        .single();

      let tagId: string;

      if (findError && findError.code === "PGRST116") {
        // Tag doesn't exist, create it
        const { data: newTag, error: createError } = await supabase
          .from("tags")
          .insert({ name: normalizedTagName })
          .select("id")
          .single();

        if (createError) {
          console.error(
            `[TagMigration] Error creating tag ${normalizedTagName}:`,
            createError
          );
          continue;
        }
        tagId = newTag.id;
        console.log(
          `[TagMigration] Created new tag: ${normalizedTagName} with ID: ${tagId}`
        );
      } else if (findError) {
        console.error(
          `[TagMigration] Error finding tag ${normalizedTagName}:`,
          findError
        );
        continue;
      } else {
        tagId = existingTag.id;
        console.log(
          `[TagMigration] Found existing tag: ${normalizedTagName} with ID: ${tagId}`
        );
      }

      // Check if recipe-tag relationship already exists
      const { data: existingRelation, error: relationCheckError } =
        await supabase
          .from("recipe_tags")
          .select("*")
          .eq("recipe_id", recipeId)
          .eq("tag_id", tagId)
          .single();

      if (relationCheckError && relationCheckError.code === "PGRST116") {
        // Relationship doesn't exist, create it
        const { error: linkError } = await supabase.from("recipe_tags").insert({
          recipe_id: recipeId,
          tag_id: tagId,
        });

        if (linkError) {
          console.error(
            `[TagMigration] Error linking tag ${normalizedTagName} to recipe:`,
            linkError
          );
          continue;
        }

        console.log(
          `[TagMigration] Linked tag ${normalizedTagName} to recipe ${recipeId}`
        );
      } else if (relationCheckError) {
        console.error(
          `[TagMigration] Error checking recipe-tag relation:`,
          relationCheckError
        );
        continue;
      } else {
        console.log(
          `[TagMigration] Tag ${normalizedTagName} already linked to recipe ${recipeId}`
        );
      }
    } catch (error) {
      console.error(`[TagMigration] Error processing tag ${tagName}:`, error);
    }
  }
}

/**
 * Migrate tags for all user recipes
 */
export async function migrateUserRecipeTags(
  userId: string
): Promise<{ success: number; failed: number; skipped: number }> {
  console.log(`[TagMigration] Starting tag migration for user ${userId}`);

  const stats = { success: 0, failed: 0, skipped: 0 };

  try {
    // Fetch all user recipes
    const { data: recipes, error: fetchError } = await supabase
      .from("recipes")
      .select(
        `
        id,
        title,
        recipe_tags (
          tag_id
        )
      `
      )
      .eq("user_id", userId);

    if (fetchError) {
      console.error("[TagMigration] Error fetching recipes:", fetchError);
      throw fetchError;
    }

    if (!recipes || recipes.length === 0) {
      console.log("[TagMigration] No recipes found for migration");
      return stats;
    }

    console.log(`[TagMigration] Found ${recipes.length} recipes to process`);

    for (const recipe of recipes) {
      try {
        // Check if recipe already has tags
        const existingTagCount = recipe.recipe_tags?.length || 0;
        if (existingTagCount > 0) {
          console.log(
            `[TagMigration] Recipe ${recipe.id} already has ${existingTagCount} tags, skipping`
          );
          stats.skipped++;
          continue;
        }

        // Generate mock tags based on title
        const mockTags = generateMockTags({ title: recipe.title } as Recipe);

        if (mockTags.length === 0) {
          console.log(
            `[TagMigration] No tags generated for recipe ${recipe.id}: ${recipe.title}`
          );
          stats.skipped++;
          continue;
        }

        // Save tags to database
        await saveTagsToDatabase(recipe.id, mockTags);
        stats.success++;

        console.log(
          `[TagMigration] Successfully migrated ${mockTags.length} tags for recipe ${recipe.id}`
        );
      } catch (error) {
        console.error(
          `[TagMigration] Error processing recipe ${recipe.id}:`,
          error
        );
        stats.failed++;
      }
    }

    console.log(`[TagMigration] Migration complete:`, stats);
    return stats;
  } catch (error) {
    console.error("[TagMigration] Migration failed:", error);
    throw error;
  }
}

/**
 * Migrate tags for a single recipe
 */
export async function migrateSingleRecipeTags(
  recipeId: string,
  recipe: Recipe
): Promise<boolean> {
  try {
    // Check if recipe already has tags in database
    const { data: existingTags, error: checkError } = await supabase
      .from("recipe_tags")
      .select("tag_id")
      .eq("recipe_id", recipeId);

    if (checkError) {
      console.error(
        `[TagMigration] Error checking existing tags for recipe ${recipeId}:`,
        checkError
      );
      return false;
    }

    if (existingTags && existingTags.length > 0) {
      console.log(
        `[TagMigration] Recipe ${recipeId} already has tags in database, skipping`
      );
      return true;
    }

    // Generate tags from the recipe data
    const tagsToSave = recipe.tags || generateMockTags(recipe);

    if (tagsToSave.length === 0) {
      console.log(`[TagMigration] No tags to save for recipe ${recipeId}`);
      return true;
    }

    // Save tags to database
    await saveTagsToDatabase(recipeId, tagsToSave);
    console.log(
      `[TagMigration] Successfully saved ${tagsToSave.length} tags for recipe ${recipeId}`
    );

    return true;
  } catch (error) {
    console.error(
      `[TagMigration] Error migrating tags for recipe ${recipeId}:`,
      error
    );
    return false;
  }
}
