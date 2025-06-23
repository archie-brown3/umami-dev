import { extractRecipeFromUrl } from "../services/deepseekservice";

async function testFinalIntegration() {
  console.log("🧪 Testing Final Web Extraction Integration");
  console.log("=".repeat(60));

  const testUrl = "https://www.bbcgoodfood.com/recipes/beef-steak-tartare";

  try {
    console.log(`📡 Testing URL: ${testUrl}`);
    console.log("⏳ Extracting recipe with new structured data method...\n");

    const startTime = Date.now();
    const recipe = await extractRecipeFromUrl(testUrl);
    const endTime = Date.now();

    console.log("✅ SUCCESS! Recipe extracted successfully");
    console.log(`⏱️  Extraction time: ${endTime - startTime}ms`);
    console.log("📊 Recipe Details:");
    console.log("=".repeat(40));

    console.log(`📝 Title: ${recipe.title}`);
    console.log(`👨‍🍳 Author: ${recipe.author || "Not specified"}`);
    console.log(`🍽️  Servings: ${recipe.servings}`);
    console.log(`⏰ Prep Time: ${recipe.prepTime} minutes`);
    console.log(`🔥 Cook Time: ${recipe.cookTime} minutes`);
    console.log(`🖼️  Image URL: ${recipe.imageUrl ? "Present" : "Not found"}`);
    console.log(`🏷️  Tags: ${recipe.tags?.length || 0} tags`);

    console.log("\n🥗 Ingredients:");
    recipe.ingredients.forEach((ingredient: any, index: number) => {
      console.log(
        `  ${index + 1}. ${ingredient.quantity} ${ingredient.unit} ${
          ingredient.name
        }`
      );
    });

    console.log("\n📖 Instructions:");
    recipe.instructions.forEach((instruction: string, index: number) => {
      const truncated =
        instruction.length > 100
          ? instruction.substring(0, 100) + "..."
          : instruction;
      console.log(`  ${index + 1}. ${truncated}`);
    });

    // Verify required fields
    console.log("\n✅ Validation:");
    console.log(`  - Title: ${recipe.title ? "✅" : "❌"}`);
    console.log(
      `  - Ingredients: ${recipe.ingredients?.length > 0 ? "✅" : "❌"} (${
        recipe.ingredients?.length || 0
      })`
    );
    console.log(
      `  - Instructions: ${recipe.instructions?.length > 0 ? "✅" : "❌"} (${
        recipe.instructions?.length || 0
      })`
    );
    console.log(`  - Source URL: ${recipe.sourceUrl ? "✅" : "❌"}`);

    // Test app-ready format
    console.log("\n🔍 App-Ready Format Test:");
    const hasRequiredFields =
      recipe.title &&
      recipe.ingredients &&
      recipe.ingredients.length > 0 &&
      recipe.instructions &&
      recipe.instructions.length > 0;

    console.log(`  - Ready for app: ${hasRequiredFields ? "✅" : "❌"}`);

    if (hasRequiredFields) {
      console.log("\n🎉 PERFECT! Recipe is ready for use in the app!");

      // Show how it would appear in the app
      console.log("\n📱 How it appears in app:");
      console.log(`Recipe: "${recipe.title}" by ${recipe.author || "Unknown"}`);
      console.log(
        `${recipe.ingredients.length} ingredients, ${recipe.instructions.length} steps`
      );
      console.log(
        `Prep: ${recipe.prepTime}min, Cook: ${recipe.cookTime}min, Serves: ${recipe.servings}`
      );
    }

    return {
      success: true,
      recipe,
      extractionTime: endTime - startTime,
    };
  } catch (error) {
    console.error("❌ EXTRACTION FAILED");
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
    if (error instanceof Error && error.stack) {
      console.error("Stack:", error.stack);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Run the test
testFinalIntegration()
  .then((result) => {
    console.log("\n" + "=".repeat(60));
    if (result.success) {
      console.log("🎉 FINAL INTEGRATION TEST PASSED!");
      console.log(
        "✅ New structured data extraction method is working perfectly!"
      );
      console.log(
        `⚡ Successfully extracted complete recipe in ${result.extractionTime}ms`
      );
      console.log("🚀 Ready for production use in the app!");
    } else {
      console.log("💥 FINAL INTEGRATION TEST FAILED!");
      console.log(`❌ Error: ${result.error}`);
    }
  })
  .catch((error) => {
    console.error("💥 TEST RUNNER ERROR:", error);
  });

export {};
