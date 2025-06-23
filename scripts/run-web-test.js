/**
 * Simple Node.js runner for testing web extraction
 * Run with: node scripts/run-web-test.js
 */

const https = require("https");
const http = require("http");

// Test the BBC Good Food URL specifically
const TEST_URL = "https://www.bbcgoodfood.com/recipes/steak-tartare";

/**
 * Simple fetch implementation for Node.js
 */
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === "https:" ? https : http;

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

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          text: () => Promise.resolve(data),
          json: () => Promise.resolve(JSON.parse(data)),
        });
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Extract structured data from HTML
 */
function extractStructuredData(html) {
  console.log(`📄 Analyzing HTML content: ${html.length} characters`);

  // Extract JSON-LD structured data
  const jsonLdRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
  const jsonLdMatches = [...html.matchAll(jsonLdRegex)];

  if (jsonLdMatches.length > 0) {
    console.log(`📋 Found ${jsonLdMatches.length} JSON-LD script(s)`);

    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match[1];
        const data = JSON.parse(jsonContent);

        console.log(
          "🔍 JSON-LD data preview:",
          JSON.stringify(data, null, 2).substring(0, 500) + "..."
        );

        // Look for Recipe schema
        const recipe = findRecipeInData(data);
        if (recipe) {
          console.log("✅ Found recipe in structured data!");
          console.log("📝 Recipe name:", recipe.name);
          console.log(
            "🥘 Ingredients count:",
            recipe.recipeIngredient?.length || 0
          );
          console.log(
            "📋 Instructions count:",
            recipe.recipeInstructions?.length || 0
          );

          if (recipe.recipeIngredient) {
            console.log("\n🥘 Ingredients preview:");
            recipe.recipeIngredient.slice(0, 3).forEach((ingredient, i) => {
              console.log(`  ${i + 1}. ${ingredient}`);
            });
            if (recipe.recipeIngredient.length > 3) {
              console.log(
                `  ... and ${recipe.recipeIngredient.length - 3} more`
              );
            }
          }

          if (recipe.recipeInstructions) {
            console.log("\n📋 Instructions preview:");
            recipe.recipeInstructions.slice(0, 2).forEach((instruction, i) => {
              const text =
                typeof instruction === "string"
                  ? instruction
                  : instruction.text || instruction.name || "Unknown step";
              console.log(
                `  ${i + 1}. ${text.substring(0, 100)}${
                  text.length > 100 ? "..." : ""
                }`
              );
            });
            if (recipe.recipeInstructions.length > 2) {
              console.log(
                `  ... and ${recipe.recipeInstructions.length - 2} more steps`
              );
            }
          }

          return {
            success: true,
            recipe: recipe,
          };
        }
      } catch (parseError) {
        console.log("⚠️ Failed to parse JSON-LD:", parseError.message);
      }
    }
  }

  // Check for Open Graph data as fallback
  const ogTitle = html.match(
    /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)/i
  )?.[1];
  const ogDescription = html.match(
    /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)/i
  )?.[1];

  if (ogTitle) {
    console.log("📰 Found Open Graph title:", ogTitle);
    console.log("📝 Found Open Graph description:", ogDescription || "None");
  }

  return { success: false };
}

/**
 * Find recipe data in structured data object
 */
function findRecipeInData(data) {
  if (Array.isArray(data)) {
    for (const item of data) {
      const recipe = findRecipeInData(item);
      if (recipe) return recipe;
    }
    return null;
  }

  if (data && typeof data === "object") {
    // Check if this object is a recipe
    if (data["@type"] === "Recipe" || data.type === "Recipe") {
      return data;
    }

    // Check nested objects
    for (const key in data) {
      if (typeof data[key] === "object" && data[key] !== null) {
        const recipe = findRecipeInData(data[key]);
        if (recipe) return recipe;
      }
    }
  }

  return null;
}

/**
 * Test the enhanced extraction API
 */
async function testEnhancedAPI(url) {
  console.log("\n🕷️ Testing enhanced extraction API...");

  try {
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
    console.log("📊 Enhanced API response status:", response.status);
    console.log("📊 Enhanced API success:", result.success);

    if (result.success && result.data) {
      console.log("📝 Caption length:", result.data.caption?.length || 0);
      console.log("🖼️ Has metadata:", !!result.data.metadata);

      if (result.data.caption && result.data.caption.length > 100) {
        console.log(
          "📄 Caption preview:",
          result.data.caption.substring(0, 200) + "..."
        );
        return { success: true, data: result.data };
      }
    }

    return { success: false, error: result.error || "No content extracted" };
  } catch (error) {
    console.log("❌ Enhanced API failed:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main test function
 */
async function runTest() {
  console.log("🧪 Testing Web Extraction for BBC Good Food");
  console.log("===========================================");
  console.log("URL:", TEST_URL);

  try {
    // Test 1: Direct HTML fetch and structured data extraction
    console.log("\n📊 Test 1: Structured Data Extraction");
    console.log("-------------------------------------");

    const response = await fetch(TEST_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const structuredResult = extractStructuredData(html);

    if (structuredResult.success) {
      console.log("\n🎉 SUCCESS: Structured data extraction worked!");
      console.log("This should be the primary extraction method.");
      return;
    }

    console.log("\n❌ Structured data extraction failed");

    // Test 2: Enhanced API
    console.log("\n📊 Test 2: Enhanced API Extraction");
    console.log("----------------------------------");

    const apiResult = await testEnhancedAPI(TEST_URL);

    if (apiResult.success) {
      console.log("\n🎉 SUCCESS: Enhanced API worked!");
      console.log("Content length:", apiResult.data.caption.length);
    } else {
      console.log("\n❌ Enhanced API failed:", apiResult.error);
    }

    console.log("\n📈 Test Complete");
    console.log("================");
    console.log(
      "Recommendation: Implement structured data extraction as primary method"
    );
    console.log("Fallback to enhanced API for sites without structured data");
  } catch (error) {
    console.error("💥 Test failed:", error.message);
  }
}

// Run the test
runTest();
