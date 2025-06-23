const { extractRecipeFromUrl } = require("../services/recipeExtractor");

async function testAppIntegration() {
  console.log("🧪 Testing App Integration with New Web Extraction Method");
  console.log("=".repeat(60));

  const testUrl = "https://www.bbcgoodfood.com/recipes/beef-steak-tartare";

  try {
    console.log(`📡 Testing URL: ${testUrl}`);
    console.log("⏳ Extracting recipe...\n");

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
    recipe.ingredients.forEach((ingredient, index) => {
      console.log(
        `  ${index + 1}. ${ingredient.quantity} ${ingredient.unit} ${
          ingredient.name
        }`
      );
    });

    console.log("\n📖 Instructions:");
    recipe.instructions.forEach((instruction, index) => {
      console.log(
        `  ${index + 1}. ${instruction.substring(0, 100)}${
          instruction.length > 100 ? "..." : ""
        }`
      );
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
    console.log(`  - Recipe ID: ${recipe.id ? "✅" : "❌"}`);

    return {
      success: true,
      recipe,
      extractionTime: endTime - startTime,
    };
  } catch (error) {
    console.error("❌ EXTRACTION FAILED");
    console.error(`Error: ${error.message}`);
    console.error("Stack:", error.stack);

    return {
      success: false,
      error: error.message,
    };
  }
}

// Run the test
testAppIntegration()
  .then((result) => {
    console.log("\n" + "=".repeat(60));
    if (result.success) {
      console.log("🎉 APP INTEGRATION TEST PASSED!");
      console.log(
        `✅ Successfully extracted recipe in ${result.extractionTime}ms`
      );
    } else {
      console.log("💥 APP INTEGRATION TEST FAILED!");
      console.log(`❌ Error: ${result.error}`);
    }
  })
  .catch((error) => {
    console.error("💥 TEST RUNNER ERROR:", error);
  });
