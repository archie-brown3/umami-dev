const fetch = require("node-fetch");
require("dotenv").config();

// Configuration using latest DeepSeek models
const CONFIG = {
  EXTRACT_API_URL: "https://recipeextractionservice.onrender.com",
  DEEPSEEK_API_URL: "https://api.deepseek.com/v1/chat/completions",
  DEEPSEEK_API_KEY:
    process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    "sk-b168886219d34d939d0b7c6f760b4123",
  TARGET_TIME: 10000, // 10 seconds for AI processing
};

class RobustInstagramExtractor {
  constructor() {
    this.startTime = Date.now();
    this.logs = [];
  }

  log(message) {
    const timestamp = Date.now() - this.startTime;
    const logMessage = `[${timestamp}ms] ${message}`;
    console.log(logMessage);
    this.logs.push(logMessage);
  }

  async extractRecipe(url) {
    this.log(`🚀 Starting ROBUST Instagram extraction`);
    this.log(`🎯 Target: <${CONFIG.TARGET_TIME / 1000} seconds`);

    try {
      // Step 1: Proven caption extraction (working method)
      const data = await this.scrapeInstagramCaption(url);

      // Step 2: DeepSeek AI recipe extraction (no fallbacks)
      const recipe = await this.extractRecipeWithDeepSeek(data);

      const totalTime = Date.now() - this.startTime;
      const success = totalTime < CONFIG.TARGET_TIME;

      this.log(`${success ? "✅" : "⚠️"} COMPLETED in ${totalTime}ms`);

      return { success: true, time: totalTime, recipe, data, logs: this.logs };
    } catch (error) {
      const totalTime = Date.now() - this.startTime;
      this.log(`❌ FAILED: ${error.message}`);
      return {
        success: false,
        time: totalTime,
        error: error.message,
        logs: this.logs,
      };
    }
  }

  async scrapeInstagramCaption(url) {
    this.log(`🔍 Scraping Instagram: ${url}`);

    // Use proven working method - exact same as successful test
    const response = await fetch(`${CONFIG.EXTRACT_API_URL}/api/scrape-web`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        options: {
          text: true, // Working script uses this
          metadata: true, // Working script uses this
          images: true, // Working script uses this
          headings: true, // Working script uses this
          links: true, // Working script uses this
          tables: false,
          forms: false,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Scrape failed: ${response.status}`);
    }

    const scrapedData = await response.json();

    // Extract using proven working method
    const caption =
      scrapedData.metadata?.open_graph?.description ||
      scrapedData.metadata?.description ||
      scrapedData.text?.full_text ||
      "No caption extracted";

    const username = this.extractUsername(url, scrapedData);
    const thumbnail = scrapedData.metadata?.open_graph?.image;

    this.log(`✅ Scraped: ${caption.length} chars, user: ${username}`);

    if (caption.length < 500) {
      throw new Error(`Caption too short: ${caption.length} chars`);
    }

    return { caption, username, thumbnail, url };
  }

  extractUsername(url, scrapedData) {
    // Try URL pattern first
    const urlMatch = url.match(/instagram\.com\/([^\/\?]+)/i);
    if (urlMatch) return urlMatch[1];

    // Try metadata
    const ogDesc = scrapedData.metadata?.open_graph?.description;
    if (ogDesc) {
      const match = ogDesc.match(/(\w+) on \w+ \d+, \d+:/);
      if (match) return match[1];
    }

    return "unknown";
  }

  async extractRecipeWithDeepSeek(data) {
    this.log(`🤖 DeepSeek extraction: ${data.caption.length} chars`);

    // Try with newest R1 model first for speed
    try {
      const result = await this.callDeepSeekAPI(
        data.caption,
        "deepseek-reasoner"
      );
      const recipe = this.parseAndValidateResponse(result, data);
      this.log(
        `✅ DeepSeek R1 succeeded: ${recipe.ingredients.length} ingredients, ${recipe.instructions.length} steps`
      );
      return recipe;
    } catch (error) {
      this.log(`⚠️ deepseek-reasoner failed: ${error.message}`);

      // Fallback to chat model
      try {
        const result = await this.callDeepSeekAPI(
          data.caption,
          "deepseek-chat"
        );
        const recipe = this.parseAndValidateResponse(result, data);
        this.log(
          `✅ DeepSeek chat succeeded: ${recipe.ingredients.length} ingredients, ${recipe.instructions.length} steps`
        );
        return recipe;
      } catch (error2) {
        this.log(`❌ deepseek-chat failed: ${error2.message}`);
        throw new Error(`All DeepSeek models failed: ${error2.message}`);
      }
    }
  }

  async callDeepSeekAPI(caption, model = "deepseek-reasoner") {
    this.log(`🔄 Calling ${model}...`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
      const messages = [
        {
          role: "system",
          content:
            'You are a recipe extraction expert. Extract recipes from text and return only valid JSON with this exact structure: {"title":"Name","description":"Brief desc","ingredients":[{"amount":1,"unit":"cup","name":"ingredient"}],"instructions":["Step 1"],"prep_time":15,"cook_time":20,"servings":4,"tags":["tag1"]}. Extract ALL ingredients and steps.',
        },
        {
          role: "user",
          content: `Extract recipe from this Instagram caption:\n\n${caption}\n\nReturn only JSON:`,
        },
      ];

      const response = await fetch(CONFIG.DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CONFIG.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.0,
          max_tokens: 1000, // Reduced further
          top_p: 0.6, // More focused
          frequency_penalty: 0,
          presence_penalty: 0,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${model} API error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      this.log(
        `✅ ${model} responded: ${
          result.choices[0]?.message?.content?.length || 0
        } chars`
      );
      return result;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  parseAndValidateResponse(response, data) {
    const content = response.choices[0]?.message?.content || "";

    if (!content) {
      throw new Error("Empty response from DeepSeek");
    }

    this.log(`📝 Parsing response: ${content.length} chars`);

    try {
      // Extract JSON from response
      let jsonString = this.extractJSON(content);

      // Parse and validate
      const parsed = JSON.parse(jsonString);

      // Validate structure
      this.validateRecipeStructure(parsed);

      // Transform to app format
      const recipe = this.transformToAppFormat(parsed, data);

      // Final validation
      this.validateRecipeQuality(recipe);

      return recipe;
    } catch (error) {
      this.log(`❌ Parse error: ${error.message}`);
      this.log(`Raw content: ${content.substring(0, 500)}...`);
      throw new Error(`Failed to parse recipe: ${error.message}`);
    }
  }

  extractJSON(content) {
    // Remove markdown code blocks
    let jsonString = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1");

    // Find JSON object bounds
    const start = jsonString.indexOf("{");
    const end = jsonString.lastIndexOf("}");

    if (start !== -1 && end !== -1 && end > start) {
      jsonString = jsonString.substring(start, end + 1);
    }

    // Clean up common JSON issues
    jsonString = jsonString
      .replace(/[\u201C\u201D]/g, '"') // Smart quotes
      .replace(/[\u2018\u2019]/g, "'") // Smart apostrophes
      .replace(/,\s*([}\]])/g, "$1") // Trailing commas
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Unquoted keys
      .trim();

    this.log(`🔧 Cleaned JSON: ${jsonString.length} chars`);
    return jsonString;
  }

  validateRecipeStructure(parsed) {
    // Check required fields
    const required = ["title", "ingredients", "instructions"];
    for (const field of required) {
      if (!parsed[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Handle nested ingredients structure
    let ingredients = parsed.ingredients;
    if (typeof ingredients === "object" && !Array.isArray(ingredients)) {
      // Flatten nested ingredient groups
      ingredients = [];
      for (const [section, items] of Object.entries(parsed.ingredients)) {
        if (Array.isArray(items)) {
          ingredients.push(...items);
        }
      }
      parsed.ingredients = ingredients; // Update the parsed object
    }

    // Check arrays
    if (!Array.isArray(parsed.ingredients) || parsed.ingredients.length === 0) {
      throw new Error(
        `Invalid ingredients: ${parsed.ingredients?.length || 0} items`
      );
    }

    if (
      !Array.isArray(parsed.instructions) ||
      parsed.instructions.length === 0
    ) {
      throw new Error(
        `Invalid instructions: ${parsed.instructions?.length || 0} items`
      );
    }

    // Check ingredient structure
    for (const ing of parsed.ingredients) {
      if (!ing.name) {
        throw new Error("Ingredient missing name");
      }
    }

    this.log(
      `✅ Structure valid: ${parsed.ingredients.length} ingredients, ${parsed.instructions.length} instructions`
    );
  }

  transformToAppFormat(parsed, data) {
    return {
      title: String(parsed.title).trim(),
      description: String(
        parsed.description || data.caption.substring(0, 200) + "..."
      ).trim(),
      author: data.username,
      sourceUrl: data.url,
      imageUrl: data.thumbnail,
      source: "Instagram",

      ingredients: parsed.ingredients.map((ing, index) => ({
        id: `ig-${Date.now()}-${index}`,
        name: String(ing.name).trim(),
        amount: parseFloat(ing.amount) || 1,
        unit: String(ing.unit || "").trim(),
      })),

      instructions: parsed.instructions.map((inst, index) => {
        const instruction = String(inst).trim();
        return instruction.startsWith(`${index + 1}.`)
          ? instruction
          : `${index + 1}. ${instruction}`;
      }),

      prepTime: parseInt(parsed.prep_time) || 15,
      cookTime: parseInt(parsed.cook_time) || 20,
      servings: parseInt(parsed.servings) || 4,

      tags: Array.isArray(parsed.tags)
        ? [
            "Instagram",
            "Recipe",
            ...parsed.tags.filter((tag) => tag && typeof tag === "string"),
          ]
        : ["Instagram", "Recipe"],

      extractedAt: new Date().toISOString(),
    };
  }

  validateRecipeQuality(recipe) {
    // Check minimum quality standards
    if (recipe.ingredients.length < 10) {
      throw new Error(
        `Too few ingredients: ${recipe.ingredients.length} (expected 15+)`
      );
    }

    if (recipe.instructions.length < 4) {
      throw new Error(
        `Too few instructions: ${recipe.instructions.length} (expected 5+)`
      );
    }

    // Check for reasonable ingredient amounts
    const badIngredients = recipe.ingredients.filter(
      (ing) => !ing.name || ing.name.length < 3 || ing.amount <= 0
    );

    if (badIngredients.length > 0) {
      throw new Error(`Invalid ingredients found: ${badIngredients.length}`);
    }

    this.log(`✅ Quality check passed: recipe meets standards`);
  }
}

// Test function with comparison to expected results
async function testInstagramExtraction(url) {
  console.log("🎯 ROBUST Instagram Recipe Extraction Test");
  console.log("=".repeat(60));
  console.log(`📱 URL: ${url}`);
  console.log(`🤖 Using: DeepSeek AI (latest models)`);
  console.log(`⏱️  Target: <${CONFIG.TARGET_TIME / 1000}s\n`);

  const extractor = new RobustInstagramExtractor();
  const result = await extractor.extractRecipe(url);

  console.log("\n📊 EXTRACTION RESULTS:");
  console.log("=".repeat(30));
  console.log(`Status: ${result.success ? "✅ SUCCESS" : "❌ FAILED"}`);
  console.log(`Time: ${result.time}ms`);
  console.log(
    `Speed: ${result.time < CONFIG.TARGET_TIME ? "🚀 FAST" : "🐌 SLOW"}`
  );

  if (result.success) {
    const recipe = result.recipe;

    console.log("\n🎯 RECIPE ACCURACY CHECK:");
    console.log("=".repeat(30));
    console.log(`📝 Title: ${recipe.title}`);
    console.log(`🥘 Ingredients: ${recipe.ingredients.length} items`);
    console.log(`👩‍🍳 Instructions: ${recipe.instructions.length} steps`);
    console.log(
      `⏱️  Times: ${recipe.prepTime}min prep + ${recipe.cookTime}min cook`
    );
    console.log(`🍽️  Servings: ${recipe.servings}`);
    console.log(`🏷️  Tags: ${recipe.tags.length} tags`);
    console.log(`👤 Author: ${recipe.author}`);
    console.log(`🖼️  Image: ${recipe.imageUrl ? "Found" : "None"}`);

    // Expected vs Actual comparison
    console.log("\n📊 ACCURACY COMPARISON:");
    console.log("=".repeat(30));
    const expected = { ingredients: 20, instructions: 6 }; // From manual parsing
    const actual = {
      ingredients: recipe.ingredients.length,
      instructions: recipe.instructions.length,
    };

    console.log(
      `Ingredients: ${actual.ingredients}/${expected.ingredients} ${
        actual.ingredients >= expected.ingredients * 0.8 ? "✅" : "❌"
      }`
    );
    console.log(
      `Instructions: ${actual.instructions}/${expected.instructions} ${
        actual.instructions >= expected.instructions * 0.8 ? "✅" : "❌"
      }`
    );

    const accuracyScore =
      ((actual.ingredients / expected.ingredients +
        actual.instructions / expected.instructions) /
        2) *
      100;
    console.log(
      `Overall Accuracy: ${accuracyScore.toFixed(1)}% ${
        accuracyScore >= 80 ? "✅ GOOD" : "❌ NEEDS WORK"
      }`
    );

    console.log("\n" + "=".repeat(60));
    console.log("📋 COMPLETE EXTRACTED RECIPE:");
    console.log("=".repeat(60));

    console.log(`🍽️  TITLE: ${recipe.title}`);
    console.log(`📝 DESCRIPTION: ${recipe.description}`);
    console.log(`👤 AUTHOR: ${recipe.author}`);
    console.log(
      `⏱️  PREP: ${recipe.prepTime}min | COOK: ${recipe.cookTime}min | SERVINGS: ${recipe.servings}`
    );
    console.log(`🔗 SOURCE: ${recipe.sourceUrl}`);
    console.log(`🖼️  IMAGE: ${recipe.imageUrl}`);

    console.log(`\n🥘 INGREDIENTS (${recipe.ingredients.length}):`);
    recipe.ingredients.forEach((ing, i) => {
      console.log(`  ${i + 1}. ${ing.amount} ${ing.unit} ${ing.name}`.trim());
    });

    console.log(`\n👩‍🍳 INSTRUCTIONS (${recipe.instructions.length}):`);
    recipe.instructions.forEach((inst, i) => {
      console.log(`  ${i + 1}. ${inst}`);
    });

    console.log(`\n🏷️  TAGS: ${recipe.tags.join(", ")}`);

    console.log("\n" + "=".repeat(60));
    console.log("🎉 EXTRACTION COMPLETED!");
  } else {
    console.log(`\n❌ EXTRACTION FAILED:`);
    console.log(`Error: ${result.error}`);

    if (result.logs) {
      console.log("\n📋 Debug Logs:");
      result.logs.forEach((log) => console.log(`  ${log}`));
    }
  }
}

// Test with provided URL
const testUrl = process.argv[2] || "https://www.instagram.com/share/BBZ133yzEX";
testInstagramExtraction(testUrl).catch(console.error);
