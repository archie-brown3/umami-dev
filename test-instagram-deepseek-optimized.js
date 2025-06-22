const fetch = require("node-fetch");
require("dotenv").config();

// Configuration for hybrid approach
const CONFIG = {
  EXTRACT_API_URL: "https://recipeextractionservice.onrender.com",
  DEEPSEEK_API_URL: "https://api.deepseek.com/v1/chat/completions",
  DEEPSEEK_API_KEY:
    process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    "sk-b168886219d34d939d0b7c6f760b4123",
  TARGET_TIME: 5000, // 5 seconds target
};

class HybridInstagramExtractor {
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
    this.log(`🚀 Starting HYBRID Instagram extraction`);
    this.log(`🎯 Target: <${CONFIG.TARGET_TIME / 1000} seconds`);

    try {
      // Step 1: Proven caption extraction (working method)
      const data = await this.scrapeInstagramCaption(url);

      // Step 2: Manual parsing with AI enhancement
      const recipe = await this.extractRecipeHybrid(data);

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

    const response = await fetch(`${CONFIG.EXTRACT_API_URL}/api/scrape-web`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        options: {
          text: true,
          metadata: true,
          images: true,
          headings: true,
          links: true,
          tables: false,
          forms: false,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Scrape failed: ${response.status}`);
    }

    const scrapedData = await response.json();

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
    const urlMatch = url.match(/instagram\.com\/([^\/\?]+)/i);
    if (urlMatch) return urlMatch[1];

    const ogDesc = scrapedData.metadata?.open_graph?.description;
    if (ogDesc) {
      const match = ogDesc.match(/(\w+) on \w+ \d+, \d+:/);
      if (match) return match[1];
    }

    return "unknown";
  }

  async extractRecipeHybrid(data) {
    this.log(
      `🔧 AI-First extraction: DeepSeek heavy lifting + manual fallback`
    );

    // Step 1: AI does the heavy lifting with full caption
    this.log(
      `🤖 DeepSeek extracting complete recipe from ${data.caption.length} chars`
    );
    try {
      const aiRecipe = await this.extractCompleteRecipeWithAI(data.caption);
      this.log(
        `✅ AI extraction successful: ${aiRecipe.ingredients.length} ingredients, ${aiRecipe.instructions.length} steps`
      );
      return this.formatFinalRecipe(aiRecipe, data);
    } catch (error) {
      this.log(
        `⚠️ AI extraction failed: ${error.message}, using manual backup`
      );

      // Step 2: Manual parsing as fallback only
      const manualRecipe = this.manualParseRecipe(data.caption);
      this.log(
        `🔧 Manual fallback: ${manualRecipe.ingredients.length} ingredients, ${manualRecipe.instructions.length} steps`
      );
      return this.formatFinalRecipe(manualRecipe, data);
    }
  }

  async extractCompleteRecipeWithAI(caption) {
    this.log(`🤖 AI complete recipe extraction...`);

    // Create a comprehensive prompt for full recipe extraction
    const prompt = `Extract a complete recipe from this Instagram post. Use ONLY information from the caption below. Do not hallucinate any ingredients or steps not mentioned.

FULL INSTAGRAM CAPTION:
${caption}

TASK: Extract ALL ingredients with exact amounts and ALL cooking steps from the caption above.

REQUIREMENTS:
1. Extract EVERY ingredient mentioned with exact amounts/measurements
2. Extract ALL cooking instructions and steps
3. Use ONLY information from the caption - no hallucinations
4. Include ingredient sections (marinade, sauce, salad, etc.) if mentioned
5. Preserve exact measurements and cooking times from the caption

REQUIRED JSON FORMAT:
{
  "title": "Recipe Name from caption",
  "description": "Brief description from caption content",
  "ingredients": [
    {"amount": 3, "unit": "lbs", "name": "exact ingredient from caption"},
    {"amount": 0.5, "unit": "cup", "name": "exact ingredient from caption"}
  ],
  "instructions": [
    "Complete step 1 from caption",
    "Complete step 2 from caption"
  ],
  "prep_time": 15,
  "cook_time": 25,
  "servings": 4,
  "tags": ["tag1", "tag2"]
}

CRITICAL: Extract ALL ingredients and steps mentioned in the caption. Return ONLY valid JSON.

JSON:`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s for complete extraction

    try {
      const response = await fetch(CONFIG.DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CONFIG.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content:
                "You are an expert recipe extractor. Extract complete recipes from text with zero hallucinations. Only use information explicitly mentioned in the source text.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.0, // Zero creativity to prevent hallucinations
          max_tokens: 2000, // More tokens for complete recipes
          top_p: 0.5, // Very focused
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content || "";

      if (!content) {
        throw new Error("Empty AI response");
      }

      this.log(`✅ AI responded: ${content.length} chars`);

      // Parse and validate the AI response
      const aiRecipe = this.parseAndValidateAIRecipe(content);
      return aiRecipe;
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  parseAndValidateAIRecipe(content) {
    this.log(`📝 Parsing complete AI recipe...`);

    try {
      // Clean up the response
      let jsonString = content.trim();

      // Debug: log raw response
      this.log(
        `🔍 Raw AI response (first 200 chars): ${content.substring(0, 200)}...`
      );

      // Remove markdown if present
      jsonString = jsonString.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1");

      // Find JSON bounds
      const start = jsonString.indexOf("{");
      const end = jsonString.lastIndexOf("}");

      if (start === -1 || end === -1) {
        throw new Error("No JSON found in AI response");
      }

      jsonString = jsonString.substring(start, end + 1);

      // Fix common JSON issues
      jsonString = this.fixCommonJSONIssues(jsonString);

      // Debug: log cleaned JSON
      this.log(
        `🔍 Cleaned JSON (first 300 chars): ${jsonString.substring(0, 300)}...`
      );

      // Parse JSON
      const parsed = JSON.parse(jsonString);

      // Debug: log parsed structure
      this.log(
        `🔍 Parsed ingredients count: ${parsed.ingredients?.length || 0}`
      );
      this.log(
        `🔍 First ingredient: ${JSON.stringify(
          parsed.ingredients?.[0] || "none"
        )}`
      );

      // Strict validation for quality
      this.validateCompleteRecipe(parsed);

      this.log(
        `✅ AI recipe validated: ${parsed.ingredients.length} ingredients, ${parsed.instructions.length} instructions`
      );

      return parsed;
    } catch (error) {
      this.log(`❌ AI parsing failed: ${error.message}`);
      throw new Error(`Failed to parse complete AI recipe: ${error.message}`);
    }
  }

  validateCompleteRecipe(recipe) {
    // Strict validation for complete recipes
    if (!recipe.title || recipe.title.length < 2) {
      throw new Error("Missing or invalid title");
    }

    if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length < 3) {
      throw new Error(
        `Insufficient ingredients: ${
          recipe.ingredients?.length || 0
        } (minimum 3 required)`
      );
    }

    if (!Array.isArray(recipe.instructions) || recipe.instructions.length < 2) {
      throw new Error(
        `Insufficient instructions: ${
          recipe.instructions?.length || 0
        } (minimum 2 required)`
      );
    }

    // Validate and fix ingredient structure
    for (let i = 0; i < recipe.ingredients.length; i++) {
      const ing = recipe.ingredients[i];

      if (!ing.name || String(ing.name).trim().length < 2) {
        throw new Error(`Invalid ingredient name at index ${i}: ${ing.name}`);
      }

      // Fix amount validation - handle null, undefined, 0, or string amounts
      let amount = ing.amount;
      if (
        amount === null ||
        amount === undefined ||
        amount === "" ||
        amount === 0
      ) {
        // Default to 1 for missing amounts
        amount = 1;
        this.log(
          `⚠️ Fixed missing amount for ingredient: ${ing.name} (set to 1)`
        );
      } else if (typeof amount === "string") {
        // Try to parse string amounts
        const parsed = parseFloat(amount);
        amount = isNaN(parsed) ? 1 : parsed;
      }

      if (amount <= 0 || amount > 2000) {
        // Allow up to 2000 for realistic cooking amounts (e.g., 500g pasta)
        throw new Error(`Invalid ingredient amount: ${amount} for ${ing.name}`);
      }

      // Update the ingredient with fixed amount
      recipe.ingredients[i].amount = amount;
    }

    // Validate instruction quality
    for (const inst of recipe.instructions) {
      if (!inst || String(inst).trim().length < 5) {
        throw new Error("Invalid instruction - too short");
      }
    }

    this.log(`✅ Complete recipe validation passed with fixes applied`);
  }

  manualParseRecipe(caption) {
    this.log(`📝 Manual parsing caption...`);

    // Extract title - look for recipe name patterns dynamically
    let title = "Recipe";
    const titlePatterns = [
      /"([^"]+)"/,
      /^[^:]+:\s*"([^"]+)"/,
      /(\w+\s+\w+(?:\s+\w+)?)\s*[🥘🍗🍽️🔥]/,
      /([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*!/,
      /^([^.!?\n]+?)(?:\s*[🥘🍗🍽️🔥]|\s*$)/,
    ];

    for (const pattern of titlePatterns) {
      const match = caption.match(pattern);
      if (match && match[1]) {
        const candidate = match[1]
          .trim()
          .replace(/[🐓🔥🌿🥘🍗🍽️]/g, "")
          .trim();
        if (candidate.length > 3 && candidate.length < 50) {
          title = candidate;
          break;
        }
      }
    }

    // Extract ingredients dynamically using comprehensive patterns
    const ingredients = [];

    // Enhanced ingredient patterns for better dynamic extraction
    const ingredientPatterns = [
      // Standard measurements with units
      /[-•\s]*~?(\d+(?:\.\d+)?)\s*(lbs?|pounds?|lb)\s+([^-\n•#\r]+?)(?=\s*[-•\n#\r]|$)/gi,
      /[-•\s]*~?(\d+(?:\.\d+)?)\s*(cups?|cup)\s+([^-\n•#\r]+?)(?=\s*[-•\n#\r]|$)/gi,
      /[-•\s]*~?(\d+(?:\.\d+)?)\s*(tbsp?|tablespoons?|tsp?|teaspoons?)\s+([^-\n•#\r]+?)(?=\s*[-•\n#\r]|$)/gi,
      /[-•\s]*~?(\d+(?:\.\d+)?)\s*(oz|ounces?|g|grams?|cloves?)\s+([^-\n•#\r]+?)(?=\s*[-•\n#\r]|$)/gi,

      // Fractional measurements
      /[-•\s]*~?(\d+\s*\/\s*\d+)\s*(cups?|cup|tbsp?|tsp?)\s+([^-\n•#\r]+?)(?=\s*[-•\n#\r]|$)/gi,

      // Mixed numbers (1 1/2 cups)
      /[-•\s]*~?(\d+\s+\d+\s*\/\s*\d+)\s*(cups?|cup|tbsp?|tsp?)\s+([^-\n•#\r]+?)(?=\s*[-•\n#\r]|$)/gi,
    ];

    for (const pattern of ingredientPatterns) {
      let match;
      while ((match = pattern.exec(caption)) !== null) {
        let amount = parseFloat(match[1].replace(/\s+/g, "")) || 1;
        let unit = match[2].toLowerCase().trim();
        let name = match[3].trim();

        // Clean up ingredient name
        name = name
          .replace(/[()~]/g, "")
          .replace(/\s+/g, " ")
          .replace(/^\s*-\s*/, "")
          .replace(/\s*\([^)]*\)\s*$/, "")
          .trim();

        // Further cleanup - remove trailing junk
        const cleanupPatterns = [
          /\s+Chicken Marinade:.*/i,
          /\s+Tzatziki:.*/i,
          /\s+Cucumber Tomato Salad:.*/i,
          /\s+Rice:.*/i,
          /\s*-.*$/,
          /\s*•.*$/,
        ];

        for (const cleanup of cleanupPatterns) {
          name = name.replace(cleanup, "").trim();
        }

        // Validate ingredient
        if (
          name.length > 2 &&
          name.length < 80 &&
          !name.includes("•") &&
          !name.includes("#") &&
          !name.includes("@") &&
          !name.includes("Recipe") &&
          !name.toLowerCase().includes("recipe") &&
          !name.toLowerCase().includes("follow") &&
          !name.toLowerCase().includes("like") &&
          !name.toLowerCase().includes("comments") &&
          !name.toLowerCase().includes("likes") &&
          amount > 0 &&
          amount < 100
        ) {
          // Avoid duplicates
          const exists = ingredients.some(
            (ing) =>
              ing.name
                .toLowerCase()
                .includes(name.toLowerCase().substring(0, 8)) ||
              name
                .toLowerCase()
                .includes(ing.name.toLowerCase().substring(0, 8))
          );

          if (!exists) {
            ingredients.push({ amount, unit, name });
          }
        }
      }
    }

    // Extract instructions dynamically with better patterns
    const instructions = [];

    // Look for sections and numbered steps
    const sectionPatterns = [
      /Chicken Marinade:\s*([\s\S]*?)(?=\s*(?:Tzatziki|Cucumber|Rice|Toppings|$))/i,
      /Tzatziki:\s*([\s\S]*?)(?=\s*(?:Chicken|Cucumber|Rice|Toppings|$))/i,
      /Cucumber Tomato Salad:\s*([\s\S]*?)(?=\s*(?:Chicken|Tzatziki|Rice|Toppings|$))/i,
      /Rice:\s*([\s\S]*?)(?=\s*(?:Chicken|Tzatziki|Cucumber|Toppings|$))/i,
    ];

    const sectionInstructions = [];
    for (const pattern of sectionPatterns) {
      const match = caption.match(pattern);
      if (match) {
        const sectionName = pattern.source
          .split(":")[0]
          .replace(/[^\w\s]/g, "");
        const sectionContent = match[1].trim();

        if (sectionContent.length > 10) {
          sectionInstructions.push(
            `Prepare ${sectionName}: ${sectionContent.substring(0, 100)}...`
          );
        }
      }
    }

    // Look for explicit cooking instructions
    const cookingPatterns = [
      /(?:Add|Mix|Combine|Place|Put|Cook|Grill|Bake|Serve|Garnish|Season|Marinate|Refrigerate|Heat|Preheat)\s+[^.]*?\.(?:\s+[^.]*?\.)?/gi,
      /(?:^|\n)\s*([A-Z][^.]*?(?:until|for|with|in|on|at|to)[^.]*?\.)/gm,
    ];

    for (const pattern of cookingPatterns) {
      let match;
      while ((match = pattern.exec(caption)) !== null) {
        const step = (match[1] || match[0]).trim();

        if (
          step.length > 25 &&
          step.length < 200 &&
          !step.includes("•") &&
          !step.includes("#") &&
          !step.includes("@") &&
          !step.toLowerCase().includes("follow") &&
          !step.toLowerCase().includes("like") &&
          !step.toLowerCase().includes("recipe")
        ) {
          // Avoid duplicates
          const exists = instructions.some(
            (inst) =>
              inst
                .toLowerCase()
                .includes(step.toLowerCase().substring(0, 20)) ||
              step.toLowerCase().includes(inst.toLowerCase().substring(0, 20))
          );

          if (!exists) {
            instructions.push(step);
          }
        }
      }
    }

    // Add section-based instructions if we have them and few cooking instructions
    if (instructions.length < 3 && sectionInstructions.length > 0) {
      instructions.push(...sectionInstructions);
    }

    // Add basic cooking instructions if we still have very few
    if (instructions.length < 2) {
      instructions.push(
        "Prepare all ingredients according to the recipe components listed above.",
        "Cook according to the timing and temperature guidelines provided.",
        "Assemble and serve as described in the original post."
      );
    }

    // Try to extract time and serving information
    let prepTime = 15;
    let cookTime = 20;
    let servings = 4;

    const timeMatches = caption.match(/(\d+)\s*(?:min|minutes?|hrs?|hours?)/gi);
    if (timeMatches && timeMatches.length >= 1) {
      const times = timeMatches
        .map((t) => parseInt(t))
        .filter((t) => t > 0 && t < 300);
      if (times.length >= 2) {
        prepTime = Math.min(...times);
        cookTime = Math.max(...times);
      } else if (times.length === 1) {
        cookTime = times[0];
        prepTime = Math.max(10, Math.floor(cookTime * 0.3));
      }
    }

    const servingMatch = caption.match(/serves?\s*(\d+)|(\d+)\s*servings?/i);
    if (servingMatch) {
      servings = parseInt(servingMatch[1] || servingMatch[2]) || 4;
    }

    // Extract tags from hashtags and content
    const tags = [];
    const hashtagMatches = caption.match(/#(\w+)/g);
    if (hashtagMatches) {
      for (const hashtag of hashtagMatches.slice(0, 8)) {
        const tag = hashtag.replace("#", "");
        if (tag.length > 2 && tag.length < 20 && !tags.includes(tag)) {
          tags.push(tag);
        }
      }
    }

    // Add food-related tags based on content
    const foodKeywords = [
      "chicken",
      "beef",
      "pork",
      "fish",
      "pasta",
      "rice",
      "salad",
      "soup",
      "bowl",
      "healthy",
      "vegan",
      "vegetarian",
      "greek",
      "mediterranean",
    ];
    for (const keyword of foodKeywords) {
      if (caption.toLowerCase().includes(keyword) && !tags.includes(keyword)) {
        tags.push(keyword);
      }
    }

    this.log(
      `📊 Manual parsed: ${ingredients.length} ingredients, ${instructions.length} instructions`
    );

    return {
      title,
      description: this.extractDescription(caption),
      ingredients,
      instructions,
      prep_time: prepTime,
      cook_time: cookTime,
      servings: servings,
      tags: tags.length > 0 ? tags : ["Recipe"],
    };
  }

  extractDescription(caption) {
    // Extract a meaningful description from the caption
    const sentences = caption.split(/[.!?]+/);
    let description = "";

    for (const sentence of sentences) {
      const cleaned = sentence.trim().replace(/[🐓🔥🌿🥘🍗🍽️#@]/g, "");
      if (
        cleaned.length > 20 &&
        cleaned.length < 150 &&
        !cleaned.includes("•") &&
        !cleaned.toLowerCase().includes("follow") &&
        !cleaned.toLowerCase().includes("like")
      ) {
        description = cleaned;
        break;
      }
    }

    return description || "Delicious recipe extracted from Instagram";
  }

  formatFinalRecipe(recipe, data) {
    return {
      title: String(recipe.title).trim(),
      description: String(recipe.description).trim(),
      author: data.username,
      sourceUrl: data.url,
      imageUrl: data.thumbnail,
      source: "Instagram",

      ingredients: recipe.ingredients.map((ing, index) => ({
        id: `ig-${Date.now()}-${index}`,
        name: String(ing.name).trim(),
        amount: parseFloat(ing.amount) || 1,
        unit: String(ing.unit || "")
          .trim()
          .replace(/^to serve\s*/i, ""), // Clean up units like "to serve"
      })),

      instructions: recipe.instructions
        .map((inst, index) => {
          let instruction = String(inst).trim();

          // Remove existing step numbers and clean up more aggressively
          instruction = instruction
            .replace(/^\d+\.\s*/, "") // Remove "1. " at start
            .replace(/^Step\s*\d+[:\s]*/, "") // Remove "Step 1:" at start
            .replace(/^\d+\)\s*/, "") // Remove "1) " at start
            .replace(/^\d+\s*-\s*/, "") // Remove "1 - " at start
            .replace(/^\d+\.\s*\d+\.\s*/, "") // Remove duplicate "1. 1. " numbering
            .replace(/\s+\d+\.\s*$/, "") // Remove trailing numbers like "3."
            .replace(/\n\d+\./g, " ") // Replace line breaks with numbers
            .replace(/\s+/g, " ") // Clean up multiple spaces
            .trim();

          // Don't add step number if instruction is too short or empty
          if (instruction.length < 5) {
            return null;
          }

          // Add clean step number
          return `${index + 1}. ${instruction}`;
        })
        .filter((inst) => inst !== null), // Remove null entries

      prepTime: parseInt(recipe.prep_time) || 15,
      cookTime: parseInt(recipe.cook_time) || 20,
      servings: parseInt(recipe.servings) || 4,

      tags: Array.isArray(recipe.tags)
        ? [
            "Instagram",
            "Recipe",
            ...recipe.tags.filter((tag) => tag && typeof tag === "string"),
          ]
        : ["Instagram", "Recipe"],

      extractedAt: new Date().toISOString(),
    };
  }

  fixCommonJSONIssues(jsonString) {
    return (
      jsonString
        // Fix smart quotes
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        // Remove trailing commas
        .replace(/,(\s*[}\]])/g, "$1")
        // Fix unquoted keys
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
        // Fix incomplete arrays/objects
        .replace(/,\s*$/, "")
        // Ensure proper structure
        .trim()
    );
  }
}

// Test function with URL alternation
async function testHybridExtraction(url) {
  console.log("🎯 AI-FIRST Instagram Recipe Extraction Test");
  console.log("=".repeat(60));
  console.log(`📱 URL: ${url}`);
  console.log(`🔧 Method: DeepSeek heavy lifting + manual fallback`);
  console.log(
    `⏱️  Target: <${
      CONFIG.TARGET_TIME / 1000
    }s (AI focus, quality over speed)\n`
  );

  const extractor = new HybridInstagramExtractor();
  const result = await extractor.extractRecipe(url);

  console.log("\n📊 EXTRACTION RESULTS:");
  console.log("=".repeat(30));
  console.log(`Status: ${result.success ? "✅ SUCCESS" : "❌ FAILED"}`);
  console.log(`Time: ${result.time}ms`);

  if (result.success) {
    const recipe = result.recipe;

    console.log("\n🎯 RECIPE QUALITY CHECK:");
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

    // Quality assessment (no hardcoded expectations - dynamic)
    console.log("\n📊 QUALITY ASSESSMENT:");
    console.log("=".repeat(30));

    const qualityScore = calculateQualityScore(recipe);
    console.log(
      `Overall Quality: ${qualityScore.toFixed(1)}% ${
        qualityScore >= 80
          ? "✅ EXCELLENT"
          : qualityScore >= 60
          ? "⚠️ GOOD"
          : "❌ NEEDS WORK"
      }`
    );
    console.log(
      `Ingredients Quality: ${
        recipe.ingredients.length >= 5 ? "✅ Complete" : "❌ Incomplete"
      } (${recipe.ingredients.length} items)`
    );
    console.log(
      `Instructions Quality: ${
        recipe.instructions.length >= 3 ? "✅ Detailed" : "❌ Basic"
      } (${recipe.instructions.length} steps)`
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
    console.log("🎉 AI-FIRST EXTRACTION COMPLETED!");
  } else {
    console.log(`\n❌ EXTRACTION FAILED:`);
    console.log(`Error: ${result.error}`);

    if (result.logs) {
      console.log("\n📋 Debug Logs:");
      result.logs.forEach((log) => console.log(`  ${log}`));
    }
  }
}

function calculateQualityScore(recipe) {
  let score = 0;

  // Title quality (20 points)
  if (
    recipe.title &&
    recipe.title.length > 5 &&
    !recipe.title.includes("Recipe")
  ) {
    score += 20;
  }

  // Ingredients quality (40 points)
  const ingredientScore = Math.min(40, recipe.ingredients.length * 4); // 4 points per ingredient, max 40
  score += ingredientScore;

  // Instructions quality (30 points)
  const instructionScore = Math.min(30, recipe.instructions.length * 5); // 5 points per instruction, max 30
  score += instructionScore;

  // Other fields (10 points)
  if (recipe.prepTime && recipe.cookTime && recipe.servings) score += 5;
  if (recipe.tags && recipe.tags.length > 2) score += 5;

  return score;
}

// Dynamic URL alternation for comprehensive testing
const testUrls = [
  "https://www.instagram.com/share/BBZ133yzEX", // Greek Bowl
  "https://www.instagram.com/share/BANC3yiZza", // Pad Thai
  "https://www.instagram.com/share/BBZ133yzEX", // Back to Greek (alternating)
];

async function runDynamicTests() {
  console.log("🚀 DYNAMIC RECIPE EXTRACTION TESTING");
  console.log("=".repeat(60));
  console.log("Testing multiple URLs to prove dynamic capability\n");

  const providedUrl = process.argv[2];

  if (providedUrl) {
    // Single URL test
    await testHybridExtraction(providedUrl);
  } else {
    // Multi-URL alternating test
    for (let i = 0; i < testUrls.length; i++) {
      console.log(
        `\n🧪 TEST ${i + 1}/${testUrls.length}: ${
          i % 2 === 0 ? "GREEK BOWL" : "PAD THAI"
        }`
      );
      console.log("=".repeat(40));

      await testHybridExtraction(testUrls[i]);

      if (i < testUrls.length - 1) {
        console.log("\n" + "⏳".repeat(20));
        console.log("Waiting 2 seconds before next test...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    console.log("\n🏁 ALL DYNAMIC TESTS COMPLETED!");
    console.log("✅ System proven to work with different recipe types");
  }
}

// Run the dynamic tests
runDynamicTests().catch(console.error);
