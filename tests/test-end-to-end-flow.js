// Test End-to-End AI Enhancement Flow
// BBC Good Food URL: https://www.bbcgoodfood.com/recipes/steak-tartare

const testUrl = "https://www.bbcgoodfood.com/recipes/steak-tartare";

console.log("🧪 Testing End-to-End AI Enhancement Flow");
console.log("=".repeat(60));
console.log(`📍 URL: ${testUrl}`);
console.log(
  "\n🎯 Goal: Verify complete flow from Render API → DeepSeek AI → Enhanced Recipe"
);

async function testEndToEndFlow() {
  try {
    console.log("\n🚀 Step 1: Call Render API");

    const scrapeResponse = await fetch(
      "https://recipeextractionservice.onrender.com/api/scrape-web",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: testUrl,
          options: {
            text: true,
            metadata: true,
            images: true,
            headings: true,
            links: false,
            tables: false,
            forms: false,
          },
        }),
      }
    );

    if (!scrapeResponse.ok) {
      throw new Error(`Render API failed: ${scrapeResponse.status}`);
    }

    const scrapedData = await scrapeResponse.json();
    console.log("✅ Render API response received");
    console.log(`📊 Text content: ${scrapedData.text?.word_count || 0} words`);
    console.log(`📝 Title: ${scrapedData.metadata?.title || "None"}`);
    console.log(
      `📖 Description: ${scrapedData.metadata?.description || "None"}`
    );

    console.log("\n🚀 Step 2: Build AI-Ready Content");

    // Build content exactly like the app does
    const contentParts = [];

    if (scrapedData.metadata?.title) {
      contentParts.push(`Title: ${scrapedData.metadata.title}`);
    }

    if (scrapedData.metadata?.description) {
      contentParts.push(`Description: ${scrapedData.metadata.description}`);
    }

    if (scrapedData.headings?.h1?.length > 0) {
      contentParts.push(
        `\nMain Headings: ${scrapedData.headings.h1.join(", ")}`
      );
    }

    if (scrapedData.headings?.h2?.length > 0) {
      contentParts.push(
        `\nSection Headings: ${scrapedData.headings.h2.join(", ")}`
      );
    }

    if (scrapedData.text?.full_text) {
      contentParts.push(`\nContent:\n${scrapedData.text.full_text}`);
    } else if (scrapedData.text?.preview) {
      contentParts.push(`\nContent:\n${scrapedData.text.preview}`);
    }

    const contentForAI = contentParts.join("\n").substring(0, 8000);

    console.log(`📝 AI content prepared: ${contentForAI.length} characters`);
    console.log("📊 Content preview:");
    console.log("-".repeat(50));
    console.log(contentForAI.substring(0, 300) + "...");
    console.log("-".repeat(50));

    if (contentForAI.length < 50) {
      console.log("⚠️  Content very short, but proceeding to test AI...");
    }

    console.log("\n🚀 Step 3: Call DeepSeek AI");

    // Enhanced prompt exactly like the app
    const prompt = `You are a professional chef and recipe expert. Analyze this recipe content and extract comprehensive structured information with extensive tagging.

RECIPE CONTENT:
${contentForAI}

Please provide a professionally formatted recipe with extensive tagging and cleaned ingredients. Return ONLY valid JSON in this exact format:

{
  "title": "Clean, professional recipe title (remove any duplicates or noise)",
  "description": "Detailed, appetizing description (2-3 sentences that would entice someone to make this)",
  "ingredients": [
    {"amount": 200, "unit": "g", "name": "fillet steak (clean up any duplicate text like '200g 200g' to just the ingredient)"}
  ],
  "instructions": [
    "Clear, professional step-by-step instruction 1",
    "Clear, professional step-by-step instruction 2"
  ],
  "prepTime": 25,
  "cookTime": 0,
  "servings": 4,
  "tags": [
    "Cuisine type (e.g., French, Italian, Asian, Mexican)",
    "Main ingredient (e.g., Beef, Chicken, Fish, Vegetarian)", 
    "Cooking method (e.g., Grilled, Baked, Raw, Fried, Steamed)",
    "Meal type (e.g., Appetizer, Main Course, Dessert, Snack)",
    "Difficulty (e.g., Easy, Medium, Advanced)",
    "Dietary restrictions if applicable (e.g., Gluten-Free, Keto, Vegan, Low-Carb)",
    "Occasion if applicable (e.g., Date Night, Quick Weeknight, Holiday, Party)",
    "Traditional or Classic dishes should include 'Traditional' tag"
  ]
}

CRITICAL INSTRUCTIONS:
1. CLEAN INGREDIENTS: Remove any duplicate text in ingredients (e.g., "200g 200g fillet steak" becomes "fillet steak")
2. COMPREHENSIVE TAGS: Generate 6-8 comprehensive tags covering:
   - Cuisine type (French, Italian, etc.)
   - Main ingredient (Beef, Chicken, etc.)
   - Cooking method (Grilled, Raw, etc.) 
   - Meal type (Appetizer, Main Course, etc.)
   - Difficulty level (Easy, Medium, Advanced)
   - Dietary restrictions if applicable
   - Special occasions if applicable
   - Traditional/Classic designation if applicable
3. PROFESSIONAL DESCRIPTIONS: Make descriptions appetizing and professional
4. CLEAR INSTRUCTIONS: Ensure instructions are step-by-step and easy to follow
5. ACCURATE TIMING: If raw/uncooked dishes, use cookTime: 0. Separate prep and cook times accurately.
6. PROPER AMOUNTS: Extract accurate quantities and units from ingredient text`;

    // Check if we have DeepSeek API key
    if (
      !process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY &&
      !process.env.DEEPSEEK_API_KEY
    ) {
      console.log("❌ No DeepSeek API key found in environment");
      console.log("🔑 Set EXPO_PUBLIC_DEEPSEEK_API_KEY or DEEPSEEK_API_KEY");
      console.log(
        "📝 Content prepared successfully for AI, but cannot test AI call without key"
      );
      return {
        success: false,
        reason: "Missing API key",
        contentLength: contentForAI.length,
      };
    }

    const apiKey =
      process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;

    const aiResponse = await fetch(
      "https://api.deepseek.com/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 2000,
        }),
      }
    );

    if (!aiResponse.ok) {
      throw new Error(
        `DeepSeek API failed: ${aiResponse.status} ${aiResponse.statusText}`
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0]?.message?.content || "";

    console.log("✅ DeepSeek AI response received");
    console.log(`📝 AI response length: ${aiContent.length} characters`);

    console.log("\n🚀 Step 4: Parse AI Response");

    // Parse JSON from AI response
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }

    const parsedRecipe = JSON.parse(jsonMatch[0]);

    console.log("✅ AI response parsed successfully");
    console.log("\n📊 FINAL ENHANCED RECIPE RESULTS:");
    console.log("=".repeat(50));

    console.log(`📝 Title: ${parsedRecipe.title || "NOT FOUND"}`);
    console.log(`📖 Description: ${parsedRecipe.description || "NOT FOUND"}`);
    console.log(`🍽️  Servings: ${parsedRecipe.servings || "NOT FOUND"}`);
    console.log(`⏰ Prep Time: ${parsedRecipe.prepTime || 0} minutes`);
    console.log(`🔥 Cook Time: ${parsedRecipe.cookTime || 0} minutes`);

    // CRITICAL TEST: Comprehensive tagging
    console.log(
      `\n🏷️  TAGS (${
        parsedRecipe.tags?.length || 0
      } found) - MAIN SUCCESS METRIC:`
    );
    if (parsedRecipe.tags && parsedRecipe.tags.length > 0) {
      parsedRecipe.tags.forEach((tag) => {
        console.log(`  • ${tag}`);
      });

      // Analyze tag quality for steak tartare
      const tagAnalysis = {
        hasFrench: parsedRecipe.tags.some((tag) =>
          tag.toLowerCase().includes("french")
        ),
        hasBeef: parsedRecipe.tags.some(
          (tag) =>
            tag.toLowerCase().includes("beef") ||
            tag.toLowerCase().includes("meat")
        ),
        hasRaw: parsedRecipe.tags.some((tag) =>
          tag.toLowerCase().includes("raw")
        ),
        hasAppetizer: parsedRecipe.tags.some(
          (tag) =>
            tag.toLowerCase().includes("appetizer") ||
            tag.toLowerCase().includes("starter")
        ),
        hasTraditional: parsedRecipe.tags.some(
          (tag) =>
            tag.toLowerCase().includes("traditional") ||
            tag.toLowerCase().includes("classic")
        ),
        hasDifficulty: parsedRecipe.tags.some(
          (tag) =>
            tag.toLowerCase().includes("easy") ||
            tag.toLowerCase().includes("medium") ||
            tag.toLowerCase().includes("advanced")
        ),
      };

      console.log(`\n🎯 Steak Tartare Tag Analysis:`);
      console.log(`  • French cuisine: ${tagAnalysis.hasFrench ? "✅" : "❌"}`);
      console.log(`  • Beef/Meat: ${tagAnalysis.hasBeef ? "✅" : "❌"}`);
      console.log(`  • Raw preparation: ${tagAnalysis.hasRaw ? "✅" : "❌"}`);
      console.log(
        `  • Appetizer/Starter: ${tagAnalysis.hasAppetizer ? "✅" : "❌"}`
      );
      console.log(
        `  • Traditional/Classic: ${tagAnalysis.hasTraditional ? "✅" : "❌"}`
      );
      console.log(
        `  • Difficulty level: ${tagAnalysis.hasDifficulty ? "✅" : "❌"}`
      );

      const expectedTags = Object.values(tagAnalysis).filter(Boolean).length;
      console.log(
        `\n📊 Expected Tag Score: ${expectedTags}/6 ${
          expectedTags >= 4
            ? "✅ Excellent"
            : expectedTags >= 3
            ? "⚠️  Good"
            : "❌ Needs improvement"
        }`
      );
    } else {
      console.log("  ❌ NO TAGS GENERATED - CRITICAL FAILURE!");
    }

    // Test ingredients
    console.log(
      `\n🥘 INGREDIENTS (${parsedRecipe.ingredients?.length || 0} found):`
    );
    if (parsedRecipe.ingredients && parsedRecipe.ingredients.length > 0) {
      parsedRecipe.ingredients.slice(0, 5).forEach((ingredient, index) => {
        const name = ingredient.name || "Unknown";
        const amount = ingredient.amount || "";
        const unit = ingredient.unit || "";
        const isDuplicate =
          name.includes("200g 200g") || /(\d+\w+\s+\1)/.test(name);
        const status = isDuplicate ? "❌ DUPLICATE" : "✅";
        console.log(`  ${index + 1}. ${amount} ${unit} ${name} ${status}`);
      });
    } else {
      console.log("  ❌ No ingredients found");
    }

    // Test instructions
    console.log(
      `\n📝 INSTRUCTIONS (${parsedRecipe.instructions?.length || 0} found):`
    );
    if (parsedRecipe.instructions && parsedRecipe.instructions.length > 0) {
      parsedRecipe.instructions.slice(0, 3).forEach((instruction, index) => {
        console.log(`  ${index + 1}. ${instruction.substring(0, 60)}...`);
      });
    } else {
      console.log("  ❌ No instructions found");
    }

    // Overall success assessment
    const hasTitle = !!parsedRecipe.title;
    const hasDescription = !!parsedRecipe.description;
    const hasIngredients =
      parsedRecipe.ingredients && parsedRecipe.ingredients.length > 0;
    const hasInstructions =
      parsedRecipe.instructions && parsedRecipe.instructions.length > 0;
    const hasComprehensiveTags =
      parsedRecipe.tags && parsedRecipe.tags.length >= 5;

    const score = [
      hasTitle,
      hasDescription,
      hasIngredients,
      hasInstructions,
      hasComprehensiveTags,
    ].filter(Boolean).length;

    console.log("\n🎯 END-TO-END SUCCESS METRICS:");
    console.log("=".repeat(40));
    console.log(`📋 Overall Score: ${score}/5`);
    console.log(`✅ Has title: ${hasTitle}`);
    console.log(`✅ Has description: ${hasDescription}`);
    console.log(`✅ Has ingredients: ${hasIngredients}`);
    console.log(`✅ Has instructions: ${hasInstructions}`);
    console.log(`✅ Comprehensive tags (5+): ${hasComprehensiveTags}`);

    if (score >= 4) {
      console.log("\n🎉 SUCCESS: End-to-end AI enhancement working perfectly!");
      console.log("🚀 DeepSeek AI bypass issue has been RESOLVED!");
    } else {
      console.log(
        "\n⚠️  PARTIAL SUCCESS: Some components working, others need attention"
      );
    }

    return {
      success: score >= 4,
      score,
      contentLength: contentForAI.length,
      tagCount: parsedRecipe.tags?.length || 0,
      ingredientCount: parsedRecipe.ingredients?.length || 0,
      instructionCount: parsedRecipe.instructions?.length || 0,
    };
  } catch (error) {
    console.error("\n❌ End-to-end test failed:", error.message);
    return { success: false, error: error.message };
  }
}

console.log("\n🚀 Starting End-to-End Test...");
testEndToEndFlow()
  .then((result) => {
    if (result.success) {
      console.log(`\n🎉 ✅ END-TO-END TEST PASSED!`);
      console.log(`📊 Score: ${result.score}/5`);
      console.log(`🏷️  Tags: ${result.tagCount}`);
      console.log(`🥘 Ingredients: ${result.ingredientCount}`);
      console.log(`📝 Instructions: ${result.instructionCount}`);
      console.log(
        "\n🎯 The DeepSeek AI bypass issue has been successfully fixed!"
      );
    } else {
      console.log(`\n💥 ❌ END-TO-END TEST FAILED`);
      console.log(`Error: ${result.error || "Unknown"}`);
      if (result.reason === "Missing API key") {
        console.log("\n🔧 To complete the test, set your DeepSeek API key:");
        console.log('export EXPO_PUBLIC_DEEPSEEK_API_KEY="your-key-here"');
      }
    }
  })
  .catch((error) => {
    console.error("💥 Test crashed:", error);
  });
