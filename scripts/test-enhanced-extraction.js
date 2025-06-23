// Test the enhanced web extraction system with Render API integration
// This tests the REAL app flow: ANY webpage → Render API → DeepSeek AI → Enhanced Recipe
const { extractRecipeFromUrl } = require("../services/deepseekservice");

// Test with multiple different websites to ensure dynamic functionality
const testUrls = [
  "https://www.bbcgoodfood.com/recipes/steak-tartare",
  "https://www.allrecipes.com/recipe/213742/cheesy-chicken-broccoli-casserole/",
  "https://www.foodnetwork.com/recipes/alton-brown/baked-macaroni-and-cheese-recipe-1939524",
  "https://www.bonappetit.com/recipe/bas-best-chocolate-chip-cookies",
];

// Or allow user to input custom URL
const customUrl = process.argv[2]; // Allow command line input: node script.js "https://example.com"
const finalTestUrls = customUrl ? [customUrl] : testUrls;

console.log("🚀 Testing Dynamic Web Extraction with Render API Integration");
console.log("=".repeat(80));
console.log("🎯 Purpose: Verify the app can extract recipes from ANY webpage");
console.log("\n🔄 Expected Flow:");
console.log("  1. ✅ ANY webpage URL → Render API service (/api/scrape-web)");
console.log("  2. ✅ Render API → BeautifulSoup scraping → Clean content");
console.log("  3. ✅ Clean content → DeepSeek AI → Enhanced recipe");
console.log("  4. ✅ Result: Professional recipe with 6-8 comprehensive tags");
console.log(
  "\n⚠️  This tests the REAL production flow, not local HTML fetching"
);

if (customUrl) {
  console.log(`\n🎯 Testing custom URL: ${customUrl}`);
} else {
  console.log(
    `\n🎯 Testing ${finalTestUrls.length} different recipe websites for compatibility`
  );
}

async function testSingleUrl(url, index = 0, total = 1) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🌐 TEST ${index + 1}/${total}: ${new URL(url).hostname}`);
  console.log(`📍 URL: ${url}`);
  console.log(`${"=".repeat(60)}`);

  try {
    console.log("🤖 Starting enhanced extraction with Render API...");
    const startTime = Date.now();

    const result = await extractRecipeFromUrl(url);

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`\n⏱️  Extraction completed in ${duration}ms`);

    // Verify Render API was used (check logs for API calls)
    console.log("\n🔍 INTEGRATION VERIFICATION:");
    if (duration > 5000) {
      console.log(
        "  ✅ Duration suggests Render API call (5+ seconds expected)"
      );
    } else {
      console.log(
        "  ⚠️  Fast duration - verify Render API was actually called"
      );
    }

    console.log("\n📋 EXTRACTION RESULTS:");
    console.log("-".repeat(40));

    // Core recipe information
    console.log(`📝 Title: ${result.title || "NOT FOUND"}`);
    console.log(
      `📖 Description: ${
        result.description
          ? result.description.substring(0, 80) + "..."
          : "NOT FOUND"
      }`
    );
    console.log(`🍽️  Servings: ${result.servings || "NOT FOUND"}`);
    console.log(`⏰ Prep Time: ${result.prepTime || 0} minutes`);
    console.log(`🔥 Cook Time: ${result.cookTime || 0} minutes`);
    console.log(`🖼️  Image URL: ${result.imageUrl ? "Found" : "NOT FOUND"}`);
    console.log(`🌐 Source: ${result.source || "NOT FOUND"}`);

    // Critical test: Comprehensive tagging (main fix we implemented)
    console.log(
      `\n🏷️  TAGS (${
        result.tags?.length || 0
      } found) - CRITICAL SUCCESS METRIC:`
    );
    if (result.tags && result.tags.length > 0) {
      result.tags.forEach((tag) => {
        console.log(`  • ${tag}`);
      });

      // Analyze tag quality and comprehensiveness
      const tagAnalysis = {
        cuisine: result.tags.filter((tag) =>
          [
            "french",
            "italian",
            "asian",
            "mexican",
            "american",
            "indian",
            "chinese",
            "thai",
          ].some((c) => tag.toLowerCase().includes(c))
        ),
        ingredient: result.tags.filter((tag) =>
          [
            "beef",
            "chicken",
            "fish",
            "pork",
            "vegetarian",
            "vegan",
            "seafood",
          ].some((i) => tag.toLowerCase().includes(i))
        ),
        method: result.tags.filter((tag) =>
          [
            "baked",
            "grilled",
            "fried",
            "roasted",
            "steamed",
            "raw",
            "sautéed",
          ].some((m) => tag.toLowerCase().includes(m))
        ),
        meal: result.tags.filter((tag) =>
          [
            "appetizer",
            "main course",
            "dessert",
            "snack",
            "breakfast",
            "lunch",
            "dinner",
          ].some((meal) => tag.toLowerCase().includes(meal))
        ),
        difficulty: result.tags.filter((tag) =>
          ["easy", "medium", "hard", "advanced", "beginner"].some((d) =>
            tag.toLowerCase().includes(d)
          )
        ),
        dietary: result.tags.filter((tag) =>
          ["keto", "low-carb", "gluten-free", "dairy-free", "healthy"].some(
            (diet) => tag.toLowerCase().includes(diet)
          )
        ),
      };

      console.log(`\n📊 Tag Analysis:`);
      console.log(
        `  • Total tags: ${result.tags.length} ${
          result.tags.length >= 5 ? "✅ Good" : "❌ Too few"
        }`
      );
      console.log(
        `  • Cuisine tags: ${tagAnalysis.cuisine.length} ${
          tagAnalysis.cuisine.length > 0 ? "✅" : "⚠️"
        }`
      );
      console.log(
        `  • Ingredient tags: ${tagAnalysis.ingredient.length} ${
          tagAnalysis.ingredient.length > 0 ? "✅" : "⚠️"
        }`
      );
      console.log(
        `  • Method tags: ${tagAnalysis.method.length} ${
          tagAnalysis.method.length > 0 ? "✅" : "⚠️"
        }`
      );
      console.log(
        `  • Meal type tags: ${tagAnalysis.meal.length} ${
          tagAnalysis.meal.length > 0 ? "✅" : "⚠️"
        }`
      );
      console.log(
        `  • Difficulty tags: ${tagAnalysis.difficulty.length} ${
          tagAnalysis.difficulty.length > 0 ? "✅" : "⚠️"
        }`
      );
      console.log(
        `  • Dietary tags: ${tagAnalysis.dietary.length} ${
          tagAnalysis.dietary.length > 0 ? "✅" : "⚠️"
        }`
      );

      const comprehensiveScore = Object.values(tagAnalysis).filter(
        (arr) => arr.length > 0
      ).length;
      console.log(
        `  • Comprehensiveness: ${comprehensiveScore}/6 ${
          comprehensiveScore >= 4
            ? "✅ Excellent"
            : comprehensiveScore >= 2
            ? "⚠️  Good"
            : "❌ Needs improvement"
        }`
      );
    } else {
      console.log("  ❌ NO TAGS FOUND - CRITICAL FAILURE!");
      console.log("  🚨 This indicates AI enhancement is not working properly");
    }

    // Test ingredients (should be clean, no duplicates)
    console.log(`\n🥘 INGREDIENTS (${result.ingredients?.length || 0} found):`);
    if (result.ingredients && result.ingredients.length > 0) {
      let cleanCount = 0;
      result.ingredients.slice(0, 5).forEach((ingredient, index) => {
        // Show first 5
        const name = ingredient.name || ingredient;
        const isDuplicate = /(\d+\w+\s+\1)/.test(name) || name.includes("  ");
        const status = isDuplicate ? "❌ DUPLICATE/MESSY" : "✅";
        if (!isDuplicate) cleanCount++;
        console.log(`  ${index + 1}. ${name} ${status}`);
      });
      if (result.ingredients.length > 5) {
        console.log(
          `  ... and ${result.ingredients.length - 5} more ingredients`
        );
      }
      console.log(
        `\n🧹 Ingredient Quality: ${cleanCount}/${Math.min(
          result.ingredients.length,
          5
        )} clean ${
          cleanCount >= Math.min(result.ingredients.length, 5) * 0.8
            ? "✅"
            : "❌"
        }`
      );
    } else {
      console.log("  ❌ No ingredients found");
    }

    // Test instructions
    console.log(
      `\n📝 INSTRUCTIONS (${result.instructions?.length || 0} found):`
    );
    if (result.instructions && result.instructions.length > 0) {
      result.instructions.slice(0, 3).forEach((instruction, index) => {
        // Show first 3
        const text =
          typeof instruction === "string"
            ? instruction
            : instruction.text || "Invalid format";
        console.log(
          `  ${index + 1}. ${text.substring(0, 60)}${
            text.length > 60 ? "..." : ""
          }`
        );
      });
      if (result.instructions.length > 3) {
        console.log(`  ... and ${result.instructions.length - 3} more steps`);
      }
    } else {
      console.log("  ❌ No instructions found");
    }

    // Overall assessment
    const hasTitle = !!result.title;
    const hasIngredients = result.ingredients && result.ingredients.length > 0;
    const hasInstructions =
      result.instructions && result.instructions.length > 0;
    const hasComprehensiveTags = result.tags && result.tags.length >= 5;

    const score = [
      hasTitle,
      hasIngredients,
      hasInstructions,
      hasComprehensiveTags,
    ].filter(Boolean).length;

    console.log("\n🎯 SUCCESS METRICS:");
    console.log("=".repeat(25));
    console.log(`📋 Overall Score: ${score}/4`);
    console.log(`✅ Has title: ${hasTitle}`);
    console.log(`✅ Has ingredients: ${hasIngredients}`);
    console.log(`✅ Has instructions: ${hasInstructions}`);
    console.log(`✅ Comprehensive tags (5+): ${hasComprehensiveTags}`);

    if (score >= 3) {
      console.log(
        `\n🎉 SUCCESS: ${new URL(url).hostname} extraction working correctly!`
      );
    } else {
      console.log(
        `\n⚠️  NEEDS ATTENTION: Issues detected with ${new URL(url).hostname}`
      );
    }

    return { success: score >= 3, score, url, duration };
  } catch (error) {
    console.error(`\n❌ Test failed for ${url}:`);
    console.error(`Error: ${error.message}`);

    // Check for specific error types
    if (error.message.includes("Render API failed")) {
      console.error("🚨 RENDER API ISSUE: Check if the service is running");
      console.error(
        "   Try: curl https://recipeextractionservice.onrender.com/health"
      );
    } else if (error.message.includes("Failed to extract recipe")) {
      console.error(
        "🚨 EXTRACTION FAILURE: The webpage might not contain recipe content"
      );
    } else {
      console.error("🚨 UNKNOWN ERROR: Check logs for details");
    }

    return { success: false, score: 0, url, error: error.message };
  }
}

async function runAllTests() {
  console.log(`\n🚀 Starting ${finalTestUrls.length} test(s)...`);

  const results = [];

  for (let i = 0; i < finalTestUrls.length; i++) {
    const result = await testSingleUrl(
      finalTestUrls[i],
      i,
      finalTestUrls.length
    );
    results.push(result);

    // Add delay between tests to be polite to servers
    if (i < finalTestUrls.length - 1) {
      console.log("\n⏳ Waiting 3 seconds before next test...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // Final summary
  console.log("\n" + "🏁 FINAL SUMMARY".padStart(50, "="));
  console.log("=".repeat(70));

  const successCount = results.filter((r) => r.success).length;
  const avgScore =
    results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const avgDuration =
    results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;

  console.log(
    `📊 Success Rate: ${successCount}/${results.length} (${Math.round(
      (successCount / results.length) * 100
    )}%)`
  );
  console.log(`📈 Average Score: ${avgScore.toFixed(1)}/4`);
  console.log(`⏱️  Average Duration: ${Math.round(avgDuration)}ms`);

  results.forEach((result, index) => {
    const status = result.success ? "✅" : "❌";
    const hostname = new URL(result.url).hostname;
    console.log(
      `  ${status} ${hostname}: ${result.score}/4 ${
        result.error ? `(${result.error})` : ""
      }`
    );
  });

  if (successCount === results.length) {
    console.log(
      "\n🎉 ALL TESTS PASSED! Dynamic web extraction is working perfectly!"
    );
    console.log(
      "🚀 The app can now extract recipes from ANY webpage using Render API!"
    );
  } else if (successCount > 0) {
    console.log(
      "\n⚠️  PARTIAL SUCCESS: Some websites working, others need attention"
    );
    console.log("🔧 Check individual results above for specific issues");
  } else {
    console.log(
      "\n🚨 ALL TESTS FAILED: Critical issues need immediate attention"
    );
    console.log("🔧 Check Render API service status and integration");
  }

  console.log("\n🔍 Quick Render API Health Check:");
  console.log(
    "   Run: curl https://recipeextractionservice.onrender.com/health"
  );
  console.log('   Expected: {"status":"ok"}');
}

// Run the tests
runAllTests().catch((error) => {
  console.error("💥 Test suite failed:", error);
  process.exit(1);
});
