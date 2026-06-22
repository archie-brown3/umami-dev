/**
 * Test script for enhanced web URL extraction
 * Tests the multi-tier extraction approach for production-grade recipe extraction
 */

import { extractRecipeFromUrl } from "@/services/recipeExtractor";

// Test URLs for different scenarios
const TEST_URLS = {
  BBC_GOOD_FOOD: "https://www.bbcgoodfood.com/recipes/steak-tartare",
  ALLRECIPES:
    "https://www.allrecipes.com/recipe/213742/cheesy-chicken-broccoli-casserole/",
  FOOD_NETWORK:
    "https://www.foodnetwork.com/recipes/alton-brown/baked-macaroni-and-cheese-recipe-1939524",
  SIMPLE_RECIPE: "https://www.simplyrecipes.com/recipes/basic_pancakes/",
} as const;

interface ExtractionResult {
  success: boolean;
  title: string;
  ingredientsCount: number;
  instructionsCount: number;
  extractionMethod?: string;
  contentLength?: number;
  errors?: string[];
}

/**
 * Enhanced web extraction using multi-tier approach
 */
async function enhancedWebExtraction(url: string): Promise<ExtractionResult> {
  console.log(`\n🔍 Starting enhanced extraction for: ${url}`);

  const result: ExtractionResult = {
    success: false,
    title: "",
    ingredientsCount: 0,
    instructionsCount: 0,
    errors: [],
  };

  try {
    // Tier 1: Structured Data Extraction
    console.log("📊 Tier 1: Attempting structured data extraction...");
    const structuredResult = await extractStructuredData(url);

    if (structuredResult.success) {
      console.log("✅ Tier 1 SUCCESS: Structured data found");
      return {
        ...result,
        ...structuredResult,
        extractionMethod: "structured-data",
      };
    }

    console.log("❌ Tier 1 FAILED: No structured data found");

    // Tier 2: Enhanced Web Scraping
    console.log("🕷️ Tier 2: Attempting enhanced web scraping...");
    const scrapingResult = await enhancedWebScraping(url);

    if (scrapingResult.success) {
      console.log("✅ Tier 2 SUCCESS: Enhanced scraping worked");
      return {
        ...result,
        ...scrapingResult,
        extractionMethod: "enhanced-scraping",
      };
    }

    console.log("❌ Tier 2 FAILED: Enhanced scraping failed");

    // Tier 3: Current API Fallback
    console.log("🔄 Tier 3: Falling back to current API...");
    const apiResult = await extractRecipeFromUrl(url);

    if (apiResult) {
      console.log("✅ Tier 3 SUCCESS: Current API worked");
      return {
        success: true,
        title: apiResult.title,
        ingredientsCount: apiResult.ingredients?.length || 0,
        instructionsCount: apiResult.instructions?.length || 0,
        extractionMethod: "current-api",
      };
    }

    console.log("❌ Tier 3 FAILED: Current API failed");
    result.errors?.push("All extraction tiers failed");
  } catch (error) {
    console.error("💥 Extraction error:", error);
    result.errors?.push(
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  return result;
}

/**
 * Tier 1: Extract structured data (JSON-LD, microdata, meta tags)
 */
async function extractStructuredData(
  url: string
): Promise<Partial<ExtractionResult>> {
  try {
    console.log("  🔍 Fetching page HTML for structured data...");

    // Use a simple fetch to get the HTML
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`  📄 Got HTML content: ${html.length} characters`);

    // Extract JSON-LD structured data
    const jsonLdMatch = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis
    );

    if (jsonLdMatch) {
      console.log(`  📋 Found ${jsonLdMatch.length} JSON-LD script(s)`);

      for (const match of jsonLdMatch) {
        try {
          const jsonContent = match
            .replace(/<script[^>]*>/i, "")
            .replace(/<\/script>/i, "");
          const data = JSON.parse(jsonContent);

          console.log(
            "  🔍 Parsing JSON-LD data:",
            JSON.stringify(data, null, 2).substring(0, 500)
          );

          // Look for Recipe schema
          const recipe = findRecipeInStructuredData(data);
          if (recipe) {
            console.log("  ✅ Found recipe in structured data!");
            return {
              success: true,
              title: recipe.name || "Extracted Recipe",
              ingredientsCount: recipe.recipeIngredient?.length || 0,
              instructionsCount: recipe.recipeInstructions?.length || 0,
              contentLength: html.length,
            };
          }
        } catch (parseError) {
          console.log("  ⚠️ Failed to parse JSON-LD:", parseError);
        }
      }
    }

    // Extract Open Graph meta tags as fallback
    const ogTitle = html.match(
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)/i
    )?.[1];
    const ogDescription = html.match(
      /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)/i
    )?.[1];

    if (ogTitle) {
      console.log(`  📰 Found Open Graph title: ${ogTitle}`);
      // This is basic fallback data, not a full recipe
      return {
        success: false,
        title: ogTitle,
        contentLength: html.length,
      };
    }

    return { success: false };
  } catch (error) {
    console.log("  ❌ Structured data extraction failed:", error);
    return { success: false };
  }
}

/**
 * Find recipe data in structured data object
 */
function findRecipeInStructuredData(data: any): any {
  // Handle array of structured data
  if (Array.isArray(data)) {
    for (const item of data) {
      const recipe = findRecipeInStructuredData(item);
      if (recipe) return recipe;
    }
    return null;
  }

  // Check if this object is a recipe
  if (data["@type"] === "Recipe" || data.type === "Recipe") {
    return data;
  }

  // Check nested objects
  for (const key in data) {
    if (typeof data[key] === "object" && data[key] !== null) {
      const recipe = findRecipeInStructuredData(data[key]);
      if (recipe) return recipe;
    }
  }

  return null;
}

/**
 * Tier 2: Enhanced web scraping with better content extraction
 */
async function enhancedWebScraping(
  url: string
): Promise<Partial<ExtractionResult>> {
  try {
    console.log("  🕷️ Attempting enhanced scraping via render API...");

    // Try the enhanced extraction API
    const response = await fetch(
      "https://recipeextractionservice.onrender.com/api/extract-enhanced",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          options: {
            waitForSelector:
              '.recipe, [itemtype*="Recipe"], .ingredients, .instructions',
            timeout: 30000,
            extractStructuredData: true,
          },
        }),
      }
    );

    const result = await response.json();
    console.log(
      "  📊 Enhanced API response:",
      JSON.stringify(result, null, 2).substring(0, 500)
    );

    if (
      result.success &&
      result.data.caption &&
      result.data.caption.length > 100
    ) {
      // Parse the extracted content for recipe data
      const recipeData = await parseContentForRecipe(result.data.caption);

      if (recipeData.success) {
        return {
          success: true,
          title: recipeData.title,
          ingredientsCount: recipeData.ingredientsCount,
          instructionsCount: recipeData.instructionsCount,
          contentLength: result.data.caption.length,
        };
      }
    }

    return { success: false };
  } catch (error) {
    console.log("  ❌ Enhanced scraping failed:", error);
    return { success: false };
  }
}

/**
 * Parse extracted content to identify recipe components
 */
async function parseContentForRecipe(content: string): Promise<{
  success: boolean;
  title: string;
  ingredientsCount: number;
  instructionsCount: number;
}> {
  try {
    // Look for recipe patterns in the content
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    let title = "Extracted Recipe";
    let ingredientsCount = 0;
    let instructionsCount = 0;

    // Find title (usually first significant line or contains "recipe")
    for (const line of lines) {
      if (
        line.length > 10 &&
        line.length < 100 &&
        (line.toLowerCase().includes("recipe") ||
          line.toLowerCase().includes("steak") ||
          /^[A-Z][a-zA-Z\s]{5,50}$/.test(line))
      ) {
        title = line;
        break;
      }
    }

    // Count potential ingredients (lines with measurements, food items)
    const ingredientPatterns = [
      /\d+\s*(cup|tbsp|tsp|oz|lb|g|kg|ml|l|clove|slice)/i,
      /^\d+\s+[a-zA-Z]/,
      /(salt|pepper|oil|butter|flour|sugar|onion|garlic|chicken|beef|egg)/i,
    ];

    for (const line of lines) {
      if (
        ingredientPatterns.some((pattern) => pattern.test(line)) &&
        line.length < 100
      ) {
        ingredientsCount++;
      }
    }

    // Count potential instructions (numbered steps, action words)
    const instructionPatterns = [
      /^\d+\./,
      /^step\s*\d+/i,
      /(heat|cook|add|mix|stir|bake|fry|boil|season|serve)/i,
    ];

    for (const line of lines) {
      if (
        instructionPatterns.some((pattern) => pattern.test(line)) &&
        line.length > 20
      ) {
        instructionsCount++;
      }
    }

    // Consider it successful if we found reasonable amounts of recipe content
    const success = ingredientsCount >= 3 && instructionsCount >= 2;

    console.log(
      `  📊 Content analysis: ${ingredientsCount} ingredients, ${instructionsCount} instructions`
    );

    return {
      success,
      title,
      ingredientsCount,
      instructionsCount,
    };
  } catch (error) {
    console.log("  ❌ Content parsing failed:", error);
    return {
      success: false,
      title: "Failed Recipe",
      ingredientsCount: 0,
      instructionsCount: 0,
    };
  }
}

/**
 * Test multiple URLs and compare results
 */
export async function testWebExtractionSuite() {
  console.log("🧪 Starting Web Extraction Test Suite");
  console.log("=====================================");

  const results: Record<string, ExtractionResult> = {};

  for (const [name, url] of Object.entries(TEST_URLS)) {
    console.log(`\n🎯 Testing: ${name}`);
    console.log(`URL: ${url}`);

    try {
      const result = await enhancedWebExtraction(url);
      results[name] = result;

      console.log(`\n📊 Results for ${name}:`);
      console.log(`  Success: ${result.success ? "✅" : "❌"}`);
      console.log(`  Title: ${result.title}`);
      console.log(`  Ingredients: ${result.ingredientsCount}`);
      console.log(`  Instructions: ${result.instructionsCount}`);
      console.log(`  Method: ${result.extractionMethod || "unknown"}`);
      if (result.contentLength) {
        console.log(`  Content Length: ${result.contentLength} chars`);
      }
      if (result.errors?.length) {
        console.log(`  Errors: ${result.errors.join(", ")}`);
      }
    } catch (error) {
      console.error(`💥 Failed to test ${name}:`, error);
      results[name] = {
        success: false,
        title: "Test Failed",
        ingredientsCount: 0,
        instructionsCount: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }

    // Add delay between requests to be respectful
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Summary
  console.log("\n📈 Test Suite Summary");
  console.log("====================");

  const successful = Object.values(results).filter((r) => r.success).length;
  const total = Object.keys(results).length;

  console.log(
    `Success Rate: ${successful}/${total} (${Math.round(
      (successful / total) * 100
    )}%)`
  );

  Object.entries(results).forEach(([name, result]) => {
    const status = result.success ? "✅" : "❌";
    const method = result.extractionMethod
      ? ` [${result.extractionMethod}]`
      : "";
    console.log(`  ${status} ${name}${method}: ${result.title}`);
  });

  return results;
}

/**
 * Quick test for BBC Good Food specifically
 */
export async function testBBCGoodFood() {
  console.log("🍽️ Testing BBC Good Food Extraction");
  console.log("===================================");

  const result = await enhancedWebExtraction(TEST_URLS.BBC_GOOD_FOOD);

  console.log("\n📊 Final Result:");
  console.log(`Success: ${result.success ? "✅" : "❌"}`);
  console.log(`Title: ${result.title}`);
  console.log(`Ingredients: ${result.ingredientsCount}`);
  console.log(`Instructions: ${result.instructionsCount}`);
  console.log(`Method: ${result.extractionMethod || "unknown"}`);

  if (result.success) {
    console.log("\n🎉 BBC Good Food extraction successful!");
  } else {
    console.log("\n😞 BBC Good Food extraction failed");
    console.log("Errors:", result.errors?.join(", ") || "Unknown");
  }

  return result;
}

// Export the test URL for easy access
export { TEST_URLS };
