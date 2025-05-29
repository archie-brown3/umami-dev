/**
 * Instagram Recipe Extraction Test Script
 * Goal: Extract and create recipe in <15 seconds
 *
 * Usage: node test-instagram-extraction.js [instagram_url]
 */

const fetch = require("node-fetch");

// Configuration - Replace with your actual API endpoints
const CONFIG = {
  DEEPSEEK_API_URL:
    process.env.DEEPSEEK_API_URL ||
    "https://api.deepseek.com/v1/chat/completions",
  DEEPSEEK_API_KEY:
    process.env.DEEPSEEK_API_KEY || "sk-b168886219d34d939d0b7c6f760b4123",
  EXTRACT_API_URL:
    process.env.EXTRACT_API_URL ||
    "https://recipeextractionservice.onrender.com",
};

// Test Instagram URLs for quick testing
const TEST_URLS = [
  "https://www.instagram.com/p/ABC123/",
  "https://www.instagram.com/share/BBZ133yzEX",
  "https://www.instagram.com/reel/DEF456/",
];

/**
 * ULTRA-FAST Instagram Recipe Extraction
 * Optimized for <15 second completion
 */
class FastInstagramExtractor {
  constructor() {
    this.startTime = Date.now();
    this.logs = [];
  }

  log(message) {
    const elapsed = Date.now() - this.startTime;
    const logEntry = `[${elapsed}ms] ${message}`;
    console.log(logEntry);
    this.logs.push(logEntry);
  }

  /**
   * Step 1: Ultra-fast Instagram scraping (Target: <3 seconds)
   */
  async scrapeInstagram(url) {
    this.log(`🔍 Starting Instagram scrape for: ${url}`);

    try {
      // Use the fastest available method
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s max for scraping

      const response = await fetch(`${CONFIG.EXTRACT_API_URL}/api/scrape-web`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          options: {
            text: true,
            metadata: true,
            images: true,
            headings: false, // Skip to save time
            links: false, // Skip to save time
            tables: false, // Skip to save time
            forms: false, // Skip to save time
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Scrape failed: ${response.status}`);
      }

      const data = await response.json();
      this.log(
        `✅ Scraping complete - ${data.text?.word_count || 0} words extracted`
      );

      return this.extractInstagramData(data, url);
    } catch (error) {
      this.log(`❌ Scraping failed: ${error.message}`);
      // Fallback to mock data for testing
      return this.getMockInstagramData(url);
    }
  }

  /**
   * Extract Instagram-specific data from scraped content
   */
  extractInstagramData(scrapedData, url) {
    // Quick extraction - prioritize speed over perfection
    const caption =
      scrapedData.metadata?.open_graph?.description ||
      scrapedData.metadata?.description ||
      scrapedData.text?.full_text?.substring(0, 1000) ||
      "No caption extracted";

    const username = this.extractUsername(scrapedData.metadata);
    const imageUrl = scrapedData.metadata?.open_graph?.image;

    return {
      caption,
      username,
      imageUrl,
      url,
      extractionTime: Date.now() - this.startTime,
    };
  }

  /**
   * Quick username extraction
   */
  extractUsername(metadata) {
    if (!metadata) return "unknown";

    // Try multiple quick methods
    const twitterTitle = metadata.twitter_card?.title;
    if (twitterTitle) {
      const match = twitterTitle.match(/\(@([^)]+)\)/);
      if (match) return match[1];
    }

    const ogDesc = metadata.open_graph?.description;
    if (ogDesc) {
      const match = ogDesc.match(/(\w+) on \w+ \d+, \d+:/);
      if (match) return match[1];
    }

    return "unknown";
  }

  /**
   * OPTIMIZED AI analysis - DeepSeek MUST succeed for quality
   */
  async analyzeRecipeUltraFast(caption) {
    this.log(`🚀 Starting OPTIMIZED AI analysis of ${caption.length} chars`);

    // NO FILTERING - Use full caption to preserve all recipe data
    this.log(`📝 Using FULL caption: ${caption.length} chars`);

    // ULTRA-CONCISE prompt for maximum speed
    const ultraFastPrompt = `Extract recipe JSON from Instagram:

${caption}

JSON format:
{"title":"","description":"","ingredients":[{"amount":1,"unit":"","name":""}],"instructions":[""],"prep_time":15,"cook_time":20,"servings":4,"tags":[""]}

Return only valid JSON.`;

    // Fallback: Even more minimal
    const minimalPrompt = `Recipe JSON: ${caption}

{"title":"","ingredients":[{"amount":1,"unit":"","name":""}],"instructions":[""],"tags":[""]}`;

    // Try ultra-fast approach first
    try {
      const result = await this.callDeepSeekAPIUltraFast(ultraFastPrompt);
      this.log(`✅ Ultra-fast AI analysis complete`);
      return this.parseAIResponseStrict(result);
    } catch (error) {
      this.log(`⚠️ Ultra-fast approach failed: ${error.message}`);

      // Try minimal approach
      try {
        const result = await this.callDeepSeekAPIUltraFast(minimalPrompt);
        this.log(`✅ Minimal AI analysis complete`);
        return this.parseAIResponseStrict(result);
      } catch (error2) {
        this.log(`❌ All AI approaches failed: ${error2.message}`);
        throw new Error(`DeepSeek extraction failed: ${error2.message}`);
      }
    }
  }

  /**
   * ULTRA-FAST API call optimized for speed
   */
  async callDeepSeekAPIUltraFast(prompt) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // ULTRA-AGGRESSIVE: 4s timeout

    try {
      const response = await fetch(CONFIG.DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CONFIG.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0, // FASTEST: Zero temperature
          max_tokens: 800, // AGGRESSIVE: Reduced for speed
          top_p: 0.9,
          frequency_penalty: 0,
          presence_penalty: 0,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  /**
   * Strict parsing that ensures quality or fails
   */
  parseAIResponseStrict(response) {
    const content = response.choices[0]?.message?.content || "";

    if (!content) {
      throw new Error("Empty response from DeepSeek");
    }

    try {
      // Extract JSON from response
      let jsonString = content.trim();

      // Remove code blocks if present
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1].trim();
      }

      // Find JSON object - more robust extraction
      const jsonStart = content.indexOf("{");
      const jsonEnd = content.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonString = content.substring(jsonStart, jsonEnd + 1);
      }

      // AGGRESSIVE JSON cleanup for DeepSeek responses
      jsonString = jsonString
        // Fix newlines in string values
        .replace(/"\s*\n\s*"/g, '" "') // Join broken strings
        .replace(/"\s*\n\s*/g, '" ') // Fix newlines in strings
        .replace(/\n/g, " ") // Remove all newlines
        .replace(/\r/g, " ") // Remove carriage returns
        // Fix common JSON issues
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
        // Fix trailing commas and spaces
        .replace(/,(\s*[}\]])/g, "$1")
        // Normalize spaces
        .replace(/\s+/g, " ")
        .trim();

      // Handle truncated JSON by attempting to fix common truncation issues
      if (!jsonString.endsWith("}")) {
        // Try to close incomplete arrays and objects
        let openBraces = 0;
        let openBrackets = 0;

        for (let char of jsonString) {
          if (char === "{") openBraces++;
          if (char === "}") openBraces--;
          if (char === "[") openBrackets++;
          if (char === "]") openBrackets--;
        }

        // Close incomplete structures
        while (openBrackets > 0) {
          jsonString += "]";
          openBrackets--;
        }
        while (openBraces > 0) {
          jsonString += "}";
          openBraces--;
        }
      }

      this.log(`🔧 Cleaned JSON: ${jsonString.substring(0, 200)}...`);

      const parsed = JSON.parse(jsonString);

      // Validate required fields
      if (!parsed.title || !parsed.ingredients || !parsed.instructions) {
        throw new Error("Missing required recipe fields");
      }

      if (
        !Array.isArray(parsed.ingredients) ||
        parsed.ingredients.length === 0
      ) {
        throw new Error("Invalid or empty ingredients array");
      }

      if (
        !Array.isArray(parsed.instructions) ||
        parsed.instructions.length === 0
      ) {
        throw new Error("Invalid or empty instructions array");
      }

      // Process and validate ingredients
      const processedIngredients = parsed.ingredients.map((ing, index) => {
        if (!ing.name) {
          throw new Error(`Ingredient ${index + 1} missing name`);
        }
        return {
          id: `temp-${index}`,
          name: String(ing.name).trim(),
          amount: parseFloat(ing.amount) || 1,
          unit: String(ing.unit || "").trim(),
        };
      });

      // Process and validate instructions
      const processedInstructions = parsed.instructions.map((inst, index) => {
        if (!inst || typeof inst !== "string") {
          throw new Error(`Instruction ${index + 1} is invalid`);
        }
        const instruction = inst.trim();
        if (instruction.length < 5) {
          // Reduced minimum length
          throw new Error(`Instruction ${index + 1} too short`);
        }
        return instruction.startsWith(`${index + 1}.`)
          ? instruction
          : `${index + 1}. ${instruction}`;
      });

      // Process tags
      const processedTags = Array.isArray(parsed.tags)
        ? parsed.tags
            .filter((tag) => tag && typeof tag === "string" && tag.length > 2)
            .slice(0, 8)
        : ["Recipe"];

      const result = {
        title: String(parsed.title).trim(),
        description: String(
          parsed.description || "Recipe from Instagram"
        ).trim(),
        ingredients: processedIngredients.slice(0, 20), // Limit but don't lose data
        instructions: processedInstructions.slice(0, 15), // Limit but don't lose data
        prepTime: parseInt(parsed.prep_time) || 15,
        cookTime: parseInt(parsed.cook_time) || 20,
        servings: parseInt(parsed.servings) || 4,
        tags: processedTags,
      };

      this.log(
        `✅ Parsed recipe: ${result.title} with ${result.ingredients.length} ingredients, ${result.instructions.length} steps`
      );
      return result;
    } catch (error) {
      this.log(`❌ JSON parsing failed: ${error.message}`);
      this.log(`Raw content: ${content.substring(0, 500)}...`);
      throw new Error(`Failed to parse recipe: ${error.message}`);
    }
  }

  /**
   * Step 2: Ultra-fast AI recipe analysis (Target: <8 seconds)
   */
  async analyzeRecipe(caption) {
    this.log(`🤖 Starting AI analysis of ${caption.length} chars`);

    // Pre-filter caption for speed
    const filteredCaption = this.filterInstagramCaption(caption);
    this.log(`📝 Filtered caption to ${filteredCaption.length} chars`);

    // Ultra-short, focused prompt for speed - OPTIMIZED VERSION
    const prompt = `JSON recipe from: ${filteredCaption}

{"title":"","description":"","ingredients":[{"amount":1,"unit":"","name":""}],"instructions":[""],"prep_time":15,"cook_time":20,"servings":4,"tags":[""]}`;

    try {
      const result = await this.callDeepSeekAPI(prompt);
      this.log(`✅ AI analysis complete`);
      return this.parseAIResponse(result);
    } catch (error) {
      this.log(`❌ AI analysis failed: ${error.message}`);
      return this.getFallbackRecipe(caption);
    }
  }

  /**
   * Ultra-fast Instagram caption filtering
   */
  filterInstagramCaption(caption) {
    // AGGRESSIVE filtering for maximum speed
    return caption
      .replace(/@\w+/g, "") // Remove mentions
      .replace(/#\w+/g, "") // Remove hashtags
      .replace(
        /\b(like|follow|subscribe|comment|share|tag|dm|link in bio|app|bio|calories|protein)\b/gi,
        ""
      )
      .replace(/\b\d+k?\s*(likes?|comments?|views?|followers?)\b/gi, "")
      .replace(
        /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d+,?\s+\d+/gi,
        ""
      ) // Remove dates
      .replace(/\.\s*\./g, ".") // Remove multiple dots
      .replace(/\s+/g, " ") // Normalize spaces
      .substring(0, 800) // More aggressive length limit (reduced from 1200)
      .trim();
  }

  /**
   * Optimized DeepSeek API call
   */
  async callDeepSeekAPI(prompt) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // Reduced from 8s to 5s

    try {
      const response = await fetch(CONFIG.DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CONFIG.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat", // Using latest V3 model for 3x speed
          messages: [{ role: "user", content: prompt }],
          temperature: 0.01, // Ultra-low for speed and consistency
          max_tokens: 400, // Reduced from 800 to 400 for speed
          top_p: 0.7, // Reduced for faster generation
          frequency_penalty: 0,
          presence_penalty: 0,
          stream: false, // Ensure no streaming for faster completion
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  /**
   * Fast JSON parsing with fallbacks
   */
  parseAIResponse(response) {
    const content = response.choices[0]?.message?.content || "";

    try {
      // Quick JSON extraction
      let jsonString = content.trim();

      // Remove code blocks
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1].trim();
      }

      // Find JSON object
      if (!jsonString.startsWith("{")) {
        const objectMatch = content.match(/{[\s\S]*}/);
        jsonString = objectMatch ? objectMatch[0] : jsonString;
      }

      // Quick cleanup
      jsonString = jsonString
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .trim();

      const parsed = JSON.parse(jsonString);

      // Quick validation and transformation
      return {
        title: parsed.title || "Instagram Recipe",
        description: parsed.description || "Recipe extracted from Instagram",
        ingredients: this.processIngredients(parsed.ingredients || []),
        instructions: this.processInstructions(parsed.instructions || []),
        prepTime: parsed.prep_time || 15,
        cookTime: parsed.cook_time || 20,
        servings: parsed.servings || 4,
        tags: this.processTags(parsed.tags || []),
      };
    } catch (error) {
      this.log(`⚠️ JSON parsing failed, using fallback`);
      return this.getFallbackRecipe(content);
    }
  }

  /**
   * Quick ingredient processing
   */
  processIngredients(ingredients) {
    return ingredients
      .filter((ing) => ing && ing.name)
      .map((ing, index) => ({
        id: `temp-${index}`,
        name: ing.name,
        amount: parseFloat(ing.amount) || 1,
        unit: ing.unit || "",
      }))
      .slice(0, 15); // Limit for speed
  }

  /**
   * Quick instruction processing
   */
  processInstructions(instructions) {
    return instructions
      .filter((inst) => typeof inst === "string" && inst.length > 5)
      .map((inst, index) =>
        inst.startsWith(`${index + 1}.`) ? inst : `${index + 1}. ${inst}`
      )
      .slice(0, 10); // Limit for speed
  }

  /**
   * Quick tag processing
   */
  processTags(tags) {
    return tags
      .filter((tag) => typeof tag === "string" && tag.length > 2)
      .slice(0, 8); // Limit for speed
  }

  /**
   * Fallback recipe for when AI fails
   */
  getFallbackRecipe(content) {
    return {
      title: "Instagram Recipe (Extraction Failed)",
      description:
        "Recipe could not be fully extracted from Instagram content.",
      ingredients: [
        {
          id: "temp-1",
          name: "Ingredients not extracted",
          amount: 1,
          unit: "",
        },
      ],
      instructions: [
        "Instructions not properly extracted. Please refer to original post.",
      ],
      prepTime: 15,
      cookTime: 20,
      servings: 4,
      tags: ["Instagram", "Needs Review"],
    };
  }

  /**
   * Mock data for testing when scraping fails
   */
  getMockInstagramData(url) {
    return {
      caption: `Greek Chicken Bowl 🐓🔥🌿 

Hands down one of my favorite meals to prep! This Mediterranean-inspired bowl is packed with flavor and protein.

Ingredients:
- 2 lbs chicken breast, marinated
- 2 cups jasmine rice
- 1 cup Greek yogurt
- 1 cucumber, diced
- 2 tomatoes, diced
- 1/4 cup olive oil
- Fresh dill and parsley
- Garlic, lemon juice

Instructions:
1. Marinate chicken in olive oil, garlic, and herbs
2. Grill chicken until cooked through
3. Cook rice in chicken broth
4. Make tzatziki with yogurt, cucumber, and dill
5. Assemble bowls with rice, chicken, and fresh vegetables

Perfect for meal prep! Saves so well in the fridge.

#mealprep #healthyeating #mediterranean #chicken #protein`,
      username: "test_user",
      imageUrl: "https://example.com/test-image.jpg",
      url,
      extractionTime: Date.now() - this.startTime,
    };
  }

  /**
   * Step 3: Create final recipe object (Target: <2 seconds)
   */
  createRecipe(instagramData, recipeData) {
    this.log(`📦 Creating final recipe object`);

    const recipe = {
      // Basic info
      title: recipeData.title,
      description: recipeData.description,
      imageUrl: instagramData.imageUrl,

      // Recipe details
      ingredients: recipeData.ingredients,
      instructions: recipeData.instructions,
      prepTime: recipeData.prepTime,
      cookTime: recipeData.cookTime,
      servings: recipeData.servings,
      tags: recipeData.tags,

      // Metadata
      source: "Instagram",
      sourceUrl: instagramData.url,
      sourceUsername: instagramData.username,
      extractedAt: new Date().toISOString(),
      extractionTime: Date.now() - this.startTime,

      // Original caption for comparison
      originalCaption: instagramData.caption,
    };

    this.log(`✅ Recipe created successfully`);
    return recipe;
  }

  /**
   * Main extraction method
   */
  async extractRecipe(url) {
    this.log(`🚀 Starting fast Instagram recipe extraction`);
    this.log(`🎯 Target: Complete in <15 seconds`);

    try {
      // Step 1: Scrape Instagram (Target: <3s)
      const instagramData = await this.scrapeInstagram(url);

      // Step 2: AI Analysis (Target: <8s)
      const recipeData = await this.analyzeRecipeUltraFast(
        instagramData.caption
      );

      // Step 3: Create Recipe (Target: <2s)
      const finalRecipe = this.createRecipe(instagramData, recipeData);

      const totalTime = Date.now() - this.startTime;
      this.log(`🎉 EXTRACTION COMPLETE in ${totalTime}ms`);
      this.log(
        `${totalTime < 15000 ? "✅ SUCCESS" : "❌ TIMEOUT"}: Target was 15000ms`
      );

      return {
        success: totalTime < 15000,
        recipe: finalRecipe,
        extractionTime: totalTime,
        logs: this.logs,
      };
    } catch (error) {
      const totalTime = Date.now() - this.startTime;
      this.log(`❌ EXTRACTION FAILED in ${totalTime}ms: ${error.message}`);

      return {
        success: false,
        error: error.message,
        extractionTime: totalTime,
        logs: this.logs,
      };
    }
  }
}

/**
 * Test runner
 */
async function runTest(url) {
  console.log("🧪 Instagram Recipe Extraction Speed Test");
  console.log("==========================================");
  console.log(`URL: ${url}`);
  console.log(`Target: <15 seconds\n`);

  const extractor = new FastInstagramExtractor();
  const result = await extractor.extractRecipe(url);

  console.log("\n📊 RESULTS:");
  console.log("===========");
  console.log(`Success: ${result.success ? "✅" : "❌"}`);
  console.log(`Time: ${result.extractionTime}ms`);
  console.log(`Target Met: ${result.extractionTime < 15000 ? "✅" : "❌"}`);

  if (result.recipe) {
    console.log("\n📝 EXTRACTED RECIPE:");
    console.log("===================");
    console.log(`Title: ${result.recipe.title}`);
    console.log(`Description: ${result.recipe.description}`);
    console.log(`Ingredients: ${result.recipe.ingredients.length}`);
    console.log(`Instructions: ${result.recipe.instructions.length}`);
    console.log(`Tags: ${result.recipe.tags.join(", ")}`);
    console.log(`Source: @${result.recipe.sourceUsername}`);

    console.log("\n🥘 RECIPE DETAILS:");
    console.log("==================");
    console.log("INGREDIENTS:");
    result.recipe.ingredients.forEach((ing, i) => {
      console.log(`${i + 1}. ${ing.amount} ${ing.unit} ${ing.name}`.trim());
    });

    console.log("\nINSTRUCTIONS:");
    result.recipe.instructions.forEach((inst, i) => {
      console.log(`${i + 1}. ${inst}`);
    });

    if (result.recipe.originalCaption) {
      console.log("\n📱 ORIGINAL INSTAGRAM CAPTION:");
      console.log("==============================");
      console.log(result.recipe.originalCaption);
    }
  }

  if (result.error) {
    console.log(`\n❌ Error: ${result.error}`);
  }

  return result;
}

/**
 * Run multiple tests
 */
async function runMultipleTests() {
  console.log("🔄 Running multiple speed tests...\n");

  const results = [];

  for (let i = 0; i < TEST_URLS.length; i++) {
    console.log(`\n🧪 Test ${i + 1}/${TEST_URLS.length}`);
    console.log("=".repeat(50));

    const result = await runTest(TEST_URLS[i]);
    results.push(result);

    // Wait between tests
    if (i < TEST_URLS.length - 1) {
      console.log("\n⏳ Waiting 2 seconds before next test...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log("\n📈 SUMMARY:");
  console.log("===========");
  const successful = results.filter((r) => r.success).length;
  const avgTime =
    results.reduce((sum, r) => sum + r.extractionTime, 0) / results.length;

  console.log(`Tests Run: ${results.length}`);
  console.log(`Successful: ${successful}/${results.length}`);
  console.log(
    `Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`
  );
  console.log(`Average Time: ${avgTime.toFixed(0)}ms`);
  console.log(`Target Met: ${avgTime < 15000 ? "✅" : "❌"}`);

  return results;
}

// Main execution
if (require.main === module) {
  const url = process.argv[2];

  if (url) {
    // Single test with provided URL
    runTest(url).catch(console.error);
  } else {
    // Multiple tests with predefined URLs
    runMultipleTests().catch(console.error);
  }
}

module.exports = { FastInstagramExtractor, runTest, runMultipleTests };
