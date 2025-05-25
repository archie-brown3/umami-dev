import { supabase } from "@/lib/supabase";

/**
 * Simple function to add some basic tags to existing recipes
 * This can be called manually to populate tags for testing
 */
export async function addBasicTagsToRecipes(userId: string): Promise<void> {
  console.log(`[SimpleTagMigration] Adding basic tags for user ${userId}`);

  try {
    // Get all recipes that don't have tags yet
    const { data: recipes, error } = await supabase
      .from("recipes")
      .select(
        `
        id,
        title,
        recipe_tags (tag_id)
      `
      )
      .eq("user_id", userId);

    if (error) {
      console.error("[SimpleTagMigration] Error fetching recipes:", error);
      return;
    }

    if (!recipes) {
      console.log("[SimpleTagMigration] No recipes found");
      return;
    }

    console.log(
      `[SimpleTagMigration] Found ${recipes.length} recipes to process`
    );

    for (const recipe of recipes) {
      // Skip if recipe already has tags
      if (recipe.recipe_tags && recipe.recipe_tags.length > 0) {
        console.log(
          `[SimpleTagMigration] Recipe ${recipe.id} already has tags, skipping`
        );
        continue;
      }

      // Add some basic tags
      const basicTags = ["dinner", "easy", "healthy"];

      for (const tagName of basicTags) {
        try {
          // Create or get tag
          const { data: existingTag, error: findError } = await supabase
            .from("tags")
            .select("id")
            .eq("name", tagName)
            .single();

          let tagId: string;

          if (findError && findError.code === "PGRST116") {
            // Create new tag
            const { data: newTag, error: createError } = await supabase
              .from("tags")
              .insert({ name: tagName })
              .select("id")
              .single();

            if (createError) {
              console.error(
                `[SimpleTagMigration] Error creating tag ${tagName}:`,
                createError
              );
              continue;
            }
            tagId = newTag.id;
          } else if (findError) {
            console.error(
              `[SimpleTagMigration] Error finding tag ${tagName}:`,
              findError
            );
            continue;
          } else {
            tagId = existingTag.id;
          }

          // Link tag to recipe
          const { error: linkError } = await supabase
            .from("recipe_tags")
            .insert({
              recipe_id: recipe.id,
              tag_id: tagId,
            });

          if (linkError) {
            console.error(
              `[SimpleTagMigration] Error linking tag ${tagName} to recipe:`,
              linkError
            );
            continue;
          }

          console.log(
            `[SimpleTagMigration] Added tag ${tagName} to recipe ${recipe.id}`
          );
        } catch (error) {
          console.error(
            `[SimpleTagMigration] Error processing tag ${tagName}:`,
            error
          );
        }
      }
    }

    console.log(`[SimpleTagMigration] Tag migration completed`);
  } catch (error) {
    console.error("[SimpleTagMigration] Migration failed:", error);
  }
}
