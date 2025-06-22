const fetch = require("node-fetch");
require("dotenv").config();

// Configuration - using proven working settings
const CONFIG = {
  EXTRACT_API_URL: "https://recipeextractionservice.onrender.com",
  TARGET_TIME: 5000, // Aggressive 5-second target
};

class FinalOptimizedExtractor {
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
    this.log(`🚀 Starting FINAL OPTIMIZED extraction`);
    this.log(`🎯 Target: <${CONFIG.TARGET_TIME / 1000} seconds`);

    try {
      // Step 1: Fast scraping using proven method
      const data = await this.scrapeInstagram(url);

      // Step 2: Manual parsing (fastest method)
      const recipe = await this.parseRecipeManually(data);

      const totalTime = Date.now() - this.startTime;
      const success = totalTime < CONFIG.TARGET_TIME;

      this.log(`${success ? "✅" : "❌"} COMPLETED in ${totalTime}ms`);

      return { success, time: totalTime, recipe, logs: this.logs };
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

  async scrapeInstagram(url) {
    this.log(`🔍 Scraping: ${url}`);

    // Use exact same options as working script
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

    return { caption, username, thumbnail, url, scrapedData };
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

  async parseRecipeManually(data) {
    this.log(`🎯 Manual parsing: ${data.caption.length} chars`);

    const title = this.extractTitle(data.caption);
    const ingredients = this.extractIngredients(data.caption);
    const instructions = this.extractInstructions(data.caption);
    const tags = this.extractTags(data.caption);

    this.log(
      `✅ Parsed: ${ingredients.length} ingredients, ${instructions.length} steps`
    );

    return {
      title: title || "Instagram Recipe",
      description: data.caption.substring(0, 200) + "...",
      author: data.username,
      sourceUrl: data.url,
      imageUrl: data.thumbnail,
      source: "Instagram",
      ingredients: ingredients,
      instructions: instructions,
      prepTime: this.estimateTime(data.caption, "prep") || 15,
      cookTime: this.estimateTime(data.caption, "cook") || 20,
      servings: this.estimateServings(data.caption) || 4,
      tags: tags,
      extractedAt: new Date().toISOString(),
    };
  }

  extractTitle(caption) {
    // More aggressive title patterns
    const patterns = [
      /^([^🔥🌿🐓\n:]+?)(?:🔥|🌿|🐓|$)/, // Before emojis
      /^(.+?)\s*(?:recipe|bowl|dish|$)/i, // Recipe keywords
      /:\s*"([^"]+)"/, // Quoted title
      /^(.+?)\s*\n/, // First line
    ];

    for (const pattern of patterns) {
      const match = caption.match(pattern);
      if (match && match[1] && match[1].trim().length > 3) {
        let title = match[1]
          .trim()
          .replace(/[🔥🌿🐓✨💯⭐]+/g, "") // Remove emojis
          .replace(/^\d+K?\s*(likes?|comments?)/i, "") // Remove social counts
          .replace(/^-\s*/, "") // Remove leading dash
          .trim();

        if (title.length > 3 && title.length < 100) {
          return title;
        }
      }
    }
    return null;
  }

  extractIngredients(caption) {
    const ingredients = [];
    const lines = caption.split("\n");
    let inIngredients = false;
    let sectionName = "";

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check if we're entering ingredients section
      if (trimmedLine.match(/^(ingredients?|recipe|full recipe)/i)) {
        inIngredients = true;
        continue;
      }

      // Check if we're leaving ingredients (entering directions)
      if (
        inIngredients &&
        trimmedLine.match(/^(directions?|instructions?|method)/i)
      ) {
        break;
      }

      // Skip empty lines
      if (!trimmedLine) continue;

      // Detect subsections (like "Marinade:", "Sauce:")
      if (inIngredients && trimmedLine.match(/^[A-Z][a-zA-Z\s]+:$/)) {
        sectionName = trimmedLine.replace(":", "").trim();
        continue;
      }

      // Extract ingredient lines
      if (inIngredients && trimmedLine.match(/^[-•~*]\s*(.+)/)) {
        const match = trimmedLine.match(/^[-•~*]\s*(.+)/);
        if (match) {
          const ingredient = this.parseIngredientLine(
            match[1].trim(),
            sectionName
          );
          if (ingredient) ingredients.push(ingredient);
        }
      }
    }

    return ingredients.slice(0, 20); // Reasonable limit
  }

  parseIngredientLine(line, section = "") {
    // Clean up the line
    line = line.replace(/[@#]\w+/g, "").trim(); // Remove mentions/hashtags

    // Parse amount patterns
    const patterns = [
      /^(~?\s*[\d\/.]+(?:\s*-\s*[\d\/.]+)?)\s*([a-zA-Z]+)?\s*(.+)/, // "2 cups flour"
      /^(.+)$/, // Fallback: whole line as ingredient
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        if (match.length > 3) {
          // Has amount and unit
          return {
            id: `temp-${Date.now()}-${Math.random()}`,
            amount: this.parseAmount(match[1]) || 1,
            unit: match[2]?.trim() || "",
            name: this.cleanIngredientName(match[3], section),
          };
        } else {
          // Just ingredient name
          return {
            id: `temp-${Date.now()}-${Math.random()}`,
            amount: 1,
            unit: "",
            name: this.cleanIngredientName(match[1], section),
          };
        }
      }
    }

    return null;
  }

  parseAmount(amountStr) {
    const clean = amountStr.replace(/[~\s]/g, "");
    if (clean.includes("/")) {
      const parts = clean.split("/");
      return parseFloat(parts[0]) / parseFloat(parts[1]);
    }
    if (clean.includes("-")) {
      const parts = clean.split("-");
      return parseFloat(parts[0]); // Use first number
    }
    return parseFloat(clean);
  }

  cleanIngredientName(name, section = "") {
    let cleaned = name
      .trim()
      .replace(/\s*\([^)]*\)/g, "") // Remove parentheses
      .replace(/\s*-\s*.*$/, "") // Remove trailing descriptions
      .trim();

    // Add section context if useful
    if (section && !cleaned.toLowerCase().includes(section.toLowerCase())) {
      cleaned = `${cleaned} (${section.toLowerCase()})`;
    }

    return cleaned;
  }

  extractInstructions(caption) {
    const instructions = [];
    const lines = caption.split("\n");
    let inDirections = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check if we're entering directions section
      if (trimmedLine.match(/^(directions?|instructions?|method)/i)) {
        inDirections = true;
        continue;
      }

      // Extract numbered instructions
      if (inDirections && trimmedLine.match(/^\d+\.\s*(.+)/)) {
        const match = trimmedLine.match(/^\d+\.\s*(.+)/);
        if (match) {
          instructions.push(match[1].trim());
        }
      }
    }

    return instructions.slice(0, 12); // Reasonable limit
  }

  extractTags(caption) {
    const tags = ["Instagram", "Recipe"];

    // Extract hashtags
    const hashtags = caption.match(/#(\w+)/g);
    if (hashtags) {
      const goodTags = hashtags
        .map((tag) => tag.slice(1))
        .filter((tag) => tag.length > 2 && tag.length < 20)
        .slice(0, 6);
      tags.push(...goodTags);
    }

    // Detect food types
    const detections = [
      { pattern: /greek/i, tag: "Greek" },
      { pattern: /mediterranean/i, tag: "Mediterranean" },
      { pattern: /healthy/i, tag: "Healthy" },
      { pattern: /bowl/i, tag: "Bowl" },
      { pattern: /chicken/i, tag: "Chicken" },
      { pattern: /meal.?prep/i, tag: "Meal Prep" },
      { pattern: /quick|easy|simple/i, tag: "Easy" },
      { pattern: /protein/i, tag: "High Protein" },
    ];

    for (const { pattern, tag } of detections) {
      if (pattern.test(caption) && !tags.includes(tag)) {
        tags.push(tag);
      }
    }

    return [...new Set(tags)].slice(0, 10); // Remove duplicates, limit
  }

  estimateTime(caption, type) {
    const patterns =
      type === "prep"
        ? [/prep[:\s]*(\d+)/i, /preparation[:\s]*(\d+)/i]
        : [/cook[:\s]*(\d+)/i, /bake[:\s]*(\d+)/i, /grill[:\s]*(\d+)/i];

    for (const pattern of patterns) {
      const match = caption.match(pattern);
      if (match) return parseInt(match[1]);
    }
    return null;
  }

  estimateServings(caption) {
    const match = caption.match(/serves?\s*(\d+)|(\d+)\s*servings?/i);
    return match ? parseInt(match[1] || match[2]) : null;
  }
}

// Test function with detailed output
async function runFinalTest(url) {
  console.log("🎯 FINAL OPTIMIZED Instagram Extraction Test");
  console.log("=".repeat(50));
  console.log(`URL: ${url}`);
  console.log(`Target: <${CONFIG.TARGET_TIME / 1000} seconds\n`);

  const extractor = new FinalOptimizedExtractor();
  const result = await extractor.extractRecipe(url);

  console.log("\n📊 PERFORMANCE RESULTS:");
  console.log("=".repeat(25));
  console.log(`Success: ${result.success ? "✅" : "❌"}`);
  console.log(`Time: ${result.time}ms`);
  console.log(
    `Target Met: ${result.time < CONFIG.TARGET_TIME ? "✅ YES" : "❌ NO"}`
  );
  console.log(
    `Speed: ${(CONFIG.TARGET_TIME / result.time).toFixed(
      1
    )}x faster than target`
  );

  if (result.success) {
    console.log("\n" + "=".repeat(60));
    console.log("📋 EXTRACTED RECIPE - COMPLETE OUTPUT");
    console.log("=".repeat(60));

    const recipe = result.recipe;
    console.log(`🍽️  TITLE: ${recipe.title}`);
    console.log(`📝 DESCRIPTION: ${recipe.description}`);
    console.log(`👤 AUTHOR: ${recipe.author}`);
    console.log(`⏱️  PREP TIME: ${recipe.prepTime} min`);
    console.log(`🔥 COOK TIME: ${recipe.cookTime} min`);
    console.log(`🍽️  SERVINGS: ${recipe.servings}`);
    console.log(`🖼️  IMAGE: ${recipe.imageUrl || "None"}`);
    console.log(`🔗 SOURCE: ${recipe.sourceUrl}`);
    console.log(`📅 EXTRACTED: ${recipe.extractedAt}`);

    console.log(`\n🥘 INGREDIENTS (${recipe.ingredients.length}):`);
    recipe.ingredients.forEach((ing, i) => {
      console.log(`  ${i + 1}. ${ing.amount} ${ing.unit} ${ing.name}`.trim());
    });

    console.log(`\n👩‍🍳 INSTRUCTIONS (${recipe.instructions.length}):`);
    recipe.instructions.forEach((inst, i) => {
      console.log(`  ${i + 1}. ${inst}`);
    });

    console.log(`\n🏷️  TAGS (${recipe.tags.length}):`);
    console.log(`  ${recipe.tags.join(", ")}`);

    console.log("\n" + "=".repeat(60));
    console.log("🎉 EXTRACTION SUCCESSFUL!");
  } else {
    console.log(`\n❌ Error: ${result.error}`);
  }
}

// Test with provided URL
const testUrl = process.argv[2] || "https://www.instagram.com/share/BBZ133yzEX";
runFinalTest(testUrl).catch(console.error);
