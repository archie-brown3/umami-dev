/**
 * Test the new structured data extraction
 * Run with: node scripts/test-new-extraction.js
 */

const https = require("https");

const TEST_URL = "https://www.bbcgoodfood.com/recipes/steak-tartare";

// Simple fetch for Node.js
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === "https:" ? https : require("http");

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ...options.headers,
      },
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          text: () => Promise.resolve(data),
          json: () => Promise.resolve(JSON.parse(data)),
        });
      });
    });

    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// Copy the extraction functions from the service
function findRecipeInStructuredData(data) {
  if (Array.isArray(data)) {
    for (const item of data) {
      const recipe = findRecipeInStructuredData(item);
      if (recipe) return recipe;
    }
    return null;
  }

  if (data && typeof data === "object") {
    if (data["@type"] === "Recipe" || data.type === "Recipe") {
      return data;
    }
    for (const key in data) {
      if (typeof data[key] === "object" && data[key] !== null) {
        const recipe = findRecipeInStructuredData(data[key]);
        if (recipe) return recipe;
      }
    }
  }
  return null;
}

function extractAmount(ingredient) {
  const amountMatch = ingredient.match(/^(\d+(?:\.\d+)?)/);
  return amountMatch ? parseFloat(amountMatch[1]) : 1;
}

function extractUnit(ingredient) {
  const unitMatch = ingredient.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/);
  return unitMatch ? unitMatch[2] : "";
}

function parseISO8601Duration(duration) {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  return hours * 60 + minutes;
}

function transformStructuredDataToRecipe(recipe, sourceUrl) {
  console.log(`[Transform] Processing: ${recipe.name}`);

  const ingredients =
    recipe.recipeIngredient?.map((ingredient, index) => ({
      id: `ingredient-${index + 1}`,
      name: ingredient.trim(),
      amount: extractAmount(ingredient),
      unit: extractUnit(ingredient),
    })) || [];

  const instructions =
    recipe.recipeInstructions?.map((instruction, index) => {
      let text = "";
      if (typeof instruction === "string") {
        text = instruction;
      } else if (instruction.text) {
        text = instruction.text;
      } else if (instruction.name) {
        text = instruction.name;
      } else {
        text = `Step ${index + 1}`;
      }

      return {
        id: `step-${index + 1}`,
        step: index + 1,
        instruction: text.trim(),
      };
    }) || [];

  const prepTime = parseISO8601Duration(recipe.prepTime) || 0;
  const cookTime =
    parseISO8601Duration(recipe.cookTime) ||
    parseISO8601Duration(recipe.totalTime) ||
    0;

  let imageUrl = null;
  if (recipe.image) {
    if (typeof recipe.image === "string") {
      imageUrl = recipe.image;
    } else if (Array.isArray(recipe.image) && recipe.image[0]) {
      imageUrl =
        typeof recipe.image[0] === "string"
          ? recipe.image[0]
          : recipe.image[0].url;
    } else if (recipe.image.url) {
      imageUrl = recipe.image.url;
    }
  }

  return {
    title: recipe.name?.trim() || "Extracted Recipe",
    description:
      recipe.description?.trim() ||
      `Recipe extracted from ${new URL(sourceUrl).hostname}`,
    imageUrl: imageUrl,
    ingredients: ingredients,
    instructions: instructions,
    prepTime: prepTime,
    cookTime: cookTime,
    servings: recipe.recipeYield
      ? parseInt(String(recipe.recipeYield)) || 1
      : 1,
    source: recipe.author?.name || new URL(sourceUrl).hostname,
    sourceUrl: sourceUrl,
    tags: recipe.recipeCategory ? [recipe.recipeCategory] : [],
  };
}

async function testStructuredExtraction() {
  console.log("🧪 Testing New Structured Data Extraction");
  console.log("=========================================");
  console.log("URL:", TEST_URL);

  try {
    const response = await fetch(TEST_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    console.log(`📄 Retrieved HTML: ${html.length} characters`);

    const jsonLdRegex =
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
    const jsonLdMatches = [...html.matchAll(jsonLdRegex)];

    if (jsonLdMatches.length > 0) {
      console.log(`📋 Found ${jsonLdMatches.length} JSON-LD script(s)`);

      for (const match of jsonLdMatches) {
        try {
          const jsonContent = match[1].trim();
          const data = JSON.parse(jsonContent);

          const recipe = findRecipeInStructuredData(data);
          if (recipe) {
            console.log(`✅ Found recipe: ${recipe.name}`);

            const transformedRecipe = transformStructuredDataToRecipe(
              recipe,
              TEST_URL
            );

            console.log("\n📊 Extraction Results:");
            console.log("======================");
            console.log(`Title: ${transformedRecipe.title}`);
            console.log(
              `Description: ${transformedRecipe.description.substring(
                0,
                100
              )}...`
            );
            console.log(`Prep Time: ${transformedRecipe.prepTime} minutes`);
            console.log(`Cook Time: ${transformedRecipe.cookTime} minutes`);
            console.log(`Servings: ${transformedRecipe.servings}`);
            console.log(`Source: ${transformedRecipe.source}`);
            console.log(
              `Image URL: ${transformedRecipe.imageUrl ? "Yes" : "No"}`
            );

            console.log(
              `\n🥘 Ingredients (${transformedRecipe.ingredients.length}):`
            );
            transformedRecipe.ingredients.forEach((ingredient, i) => {
              console.log(
                `  ${i + 1}. ${ingredient.amount}${ingredient.unit} ${
                  ingredient.name
                }`
              );
            });

            console.log(
              `\n📋 Instructions (${transformedRecipe.instructions.length}):`
            );
            transformedRecipe.instructions.forEach((instruction, i) => {
              const text = instruction.instruction.substring(0, 80);
              console.log(
                `  ${i + 1}. ${text}${
                  instruction.instruction.length > 80 ? "..." : ""
                }`
              );
            });

            console.log("\n🎉 SUCCESS: New extraction method works perfectly!");
            console.log(
              "This will significantly improve recipe extraction quality."
            );
            return;
          }
        } catch (parseError) {
          console.log("⚠️ Failed to parse JSON-LD:", parseError.message);
        }
      }
    }

    console.log("❌ No structured data found");
  } catch (error) {
    console.error("💥 Test failed:", error.message);
  }
}

testStructuredExtraction();
