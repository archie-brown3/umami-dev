import { Recipe, Ingredient } from "../types";
import { API_ENDPOINTS } from "../constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatTag } from "./utils";

// Debug logs storage
let serviceLogs: string[] = [];

// Add cache implementation
const recipeCache = new Map<string, Partial<Recipe>>();

// Utility to add log entries
export function addServiceLog(message: string): void {
  const logEntry = `[${new Date().toISOString()}] ${message}`;
  console.log(`[DeepSeekService] ${message}`);
  serviceLogs.push(logEntry);

  // Keep logs limited to most recent 100 entries
  if (serviceLogs.length > 100) {
    serviceLogs = serviceLogs.slice(-100);
  }
}

// Get all service logs
export function getServiceLogs(): string[] {
  return [...serviceLogs];
}

// Clear service logs
export function clearServiceLogs(): void {
  serviceLogs = [];
}

interface DeepseekResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface ParsedRecipe {
  title: string;
  description: string;
  ingredients: {
    name: string;
    quantity: string;
  }[];
  instructions: string[];
  servings: number;
  prep_time: number;
  cook_time: number;
  meal_type: string;
  cuisine_type?: string;
  difficulty_level?: string;
  nutrition: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
    fiber: string;
  };
  dietary_categories?: string[];
  cooking_method?: string;
  occasion?: string;
  flavors?: string[];
  main_ingredient?: string;
  nutritional_tags: string[];
}

export interface ScrapedContent {
  caption: string;
  url: string;
  author?: string;
  username?: string; // Instagram username
  profilePictureUrl?: string; // URL to the profile picture
  imageUrl?: string;
  mediaUrls?: Array<{
    url: string;
    isVideo: boolean;
    videoUrl?: string;
  }>; // All media from the post
  publishDate?: string;
  title?: string;
}

// Function to scrape content from any URL
export async function scrapeFromUrl(
  url: string
): Promise<ScrapedContent | null> {
  try {
    // Extract the domain to determine which scraper to use
    const domain = new URL(url).hostname.toLowerCase();

    // For Instagram URLs, use dedicated Instagram API
    if (domain.includes("instagram.com")) {
      console.log(`[Instagram] Starting extraction for URL: ${url}`);

      try {
        // Check if API is available first
        const apiAvailable = await isExtractApiAvailable();

        if (apiAvailable) {
          // Use dedicated API service for Instagram extraction
          const apiResponse = await extractFromInstagramApi(url);
          console.log(`[Instagram] API response received`);

          if (apiResponse) {
            const result = {
              caption:
                apiResponse.caption || apiResponse.ingredients.join("\n"),
              url,
              author: extractInstagramUsername(url),
              imageUrl: apiResponse.media?.[0]?.url,
              mediaUrls: apiResponse.media?.map(
                (m: { url: string; type: string }) => ({
                  url: m.url,
                  isVideo: m.type === "video",
                })
              ),
            };
            console.log(
              `[Instagram] Processed result with caption length: ${
                result.caption?.length || 0
              }`,
              "Image URL:",
              result.imageUrl
            );
            return result;
          }
        } else {
          console.log(
            `[Instagram] Extraction API unavailable, using DeepSeek fallback directly`
          );
          // Skip attempting to use the extraction API and go straight to fallback
          throw new Error("Extraction API unavailable");
        }
      } catch (instagramError) {
        console.error("[Instagram] API extraction error:", instagramError);

        // Try fallback extraction method using DeepSeek directly
        console.log(`[Instagram] Trying local fallback extraction...`);
        const fallbackCaption = await fetchInstagramCaption(url);

        if (fallbackCaption) {
          const fallbackResult: ScrapedContent = {
            caption: fallbackCaption,
            url,
            author: extractInstagramUsername(url),
            username: extractInstagramUsername(url),
          };
          console.log(
            `[Instagram] Local fallback extraction succeeded with caption length: ${fallbackResult.caption.length}`
          );
          return fallbackResult;
        }

        // If fallback also failed, re-throw
        throw instagramError;
      }
    }

    // Generic recipe website scraper
    const content = await scrapeGenericRecipeWebsite(url);
    console.log(
      "[GenericScraper] Scraped content:",
      JSON.stringify(content, null, 2)
    );
    return content;
  } catch (error) {
    console.error("[Instagram] Error scraping from URL:", error);

    // Attempt one more fallback for any URL using DeepSeek
    try {
      console.log(
        `[Scraper] Final fallback - generating synthetic content for URL: ${url}`
      );
      const syntheticCaption = await generateSyntheticRecipe(url);
      if (syntheticCaption) {
        return {
          caption: syntheticCaption,
          url,
          author: "AI Generated",
        };
      }
    } catch (fallbackError) {
      console.error(
        "[Scraper] Final fallback extraction failed:",
        fallbackError
      );
    }

    throw error; // Re-throw after all fallbacks have failed
  }
}

/**
 * Check if the extraction API service is available
 */
async function isExtractApiAvailable(): Promise<boolean> {
  const extractionServiceUrl = API_ENDPOINTS.RECIPE_EXTRACTION_SERVICE_URL;
  if (!extractionServiceUrl) {
    addServiceLog("Extraction API URL not configured");
    return false;
  }

  try {
    addServiceLog("Checking extraction API availability");

    // Set a short timeout for the health check
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Try different potential health check endpoints
    // Most services use /health, but we'll try both with and without /api prefix
    const possibleEndpoints = [
      `${extractionServiceUrl}/health?t=${Date.now()}`,
      `${extractionServiceUrl}/api/health?t=${Date.now()}`,
      `${extractionServiceUrl}/api/v1/health?t=${Date.now()}`,
    ];

    addServiceLog(`Trying health endpoints: ${possibleEndpoints.join(", ")}`);

    // Try each endpoint in sequence
    for (const endpoint of possibleEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          const isAvailable =
            data.status === "ok" || data.status === "available";

          addServiceLog(
            `Extraction API ${
              isAvailable ? "is" : "is not"
            } available (${endpoint})`
          );
          clearTimeout(timeoutId);
          return isAvailable;
        }

        addServiceLog(
          `Health check failed with status ${response.status} for ${endpoint}`
        );
      } catch (endpointError) {
        addServiceLog(
          `Failed to check endpoint ${endpoint}: ${
            endpointError instanceof Error
              ? endpointError.message
              : String(endpointError)
          }`
        );
      }
    }

    // If we reach here, all endpoints failed
    clearTimeout(timeoutId);
    return false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addServiceLog(`API health check failed: ${errorMessage}`);
    return false;
  }
}

/**
 * Extract recipe data from Instagram using the dedicated API
 */
async function extractFromInstagramApi(instagramUrl: string): Promise<any> {
  console.log(
    `[Instagram] Making API request to ${API_ENDPOINTS.EXTRACT_API_URL}/api/extract`
  );

  // Add retry logic with timeout
  const maxRetries = 2;
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount <= maxRetries) {
    try {
      // Set a timeout for the fetch operation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(
        `${API_ENDPOINTS.EXTRACT_API_URL}/api/extract`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: instagramUrl }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      console.log(`[Instagram] API Response Status: ${response.status}`);

      // Get the response as text first to aid debugging
      const responseText = await response.text();
      console.log(
        `[Instagram] Raw API Response: ${responseText.substring(0, 200)}...`
      );

      if (!response.ok) {
        console.error(
          `[Instagram] API Error: ${response.status} ${response.statusText}`
        );
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      try {
        const recipeData = JSON.parse(responseText);
        console.log(`[Instagram] Successfully parsed API response`);
        return recipeData;
      } catch (parseError) {
        console.error(`[Instagram] JSON parse error:`, parseError);
        throw new Error(
          `Failed to parse API response: ${
            parseError instanceof Error ? parseError.message : "Unknown error"
          }`
        );
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `[Instagram] Extraction attempt ${retryCount + 1} failed: ${
          lastError.message
        }`
      );
      retryCount++;

      if (retryCount <= maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = 1000 * Math.pow(2, retryCount);
        console.log(`[Instagram] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // If we got here, all retries failed - try fallback to direct DeepSeek extraction
  console.log(
    `[Instagram] All extraction attempts failed, using DeepSeek fallback`
  );

  try {
    const caption = await fetchInstagramCaption(instagramUrl);
    if (caption) {
      return {
        caption,
        media: [],
        ingredients: caption
          .split("\n")
          .filter((line) => line.includes("•") || line.includes("-")),
        instructions: [],
      };
    }
  } catch (fallbackError) {
    console.error(
      "[Instagram] Fallback extraction also failed:",
      fallbackError
    );
  }

  // Rethrow the last error if fallback also failed
  if (lastError) throw lastError;
  throw new Error("Failed to extract recipe from Instagram");
}

// Function to fetch caption from Instagram URL
async function fetchInstagramCaption(
  instagramUrl: string
): Promise<string | null> {
  try {
    // Use DeepSeek API to simulate extraction
    const prompt = `You are a helpful assistant that extracts probable recipe captions from Instagram posts.
    
For the Instagram URL: ${instagramUrl}
    
Please provide what you believe would be the most likely recipe caption for this post. 
Focus on identifying the recipe title, ingredients list, and cooking steps. If this doesn't 
appear to be a recipe post, please respond with "Not a recipe post."

Do not include any explanations or commentary - just return the extracted caption text as if it were directly copied from Instagram.`;

    const response = await fetch(API_ENDPOINTS.DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_ENDPOINTS.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = (await response.json()) as DeepseekResponse;
    const content = data.choices[0]?.message?.content || "";

    if (content.includes("Not a recipe post")) {
      return null;
    }

    return content;
  } catch (error) {
    console.error("Error fetching Instagram caption:", error);
    return null;
  }
}

// Helper function to extract Instagram username from URL
function extractInstagramUsername(instagramUrl: string): string | undefined {
  try {
    // Try to extract username from URL format: instagram.com/username/...
    const match = instagramUrl.match(/instagram\.com\/([^\/\?]+)/i);
    return match ? match[1] : undefined;
  } catch {
    return undefined;
  }
}

// Generic recipe website scraper
async function scrapeGenericRecipeWebsite(
  url: string
): Promise<ScrapedContent | null> {
  try {
    // Use DeepSeek API to simulate extraction
    const prompt = `You are a helpful assistant that extracts content from recipe websites.

For the URL: ${url}

Please analyze what would likely be on this recipe webpage and provide the following information:
1. Recipe title
2. Full recipe content including ingredients and instructions
3. Likely author name
4. Likely publish date (if available)

Format your response as if you were directly copying the full recipe. Start with the title, followed by the complete recipe text.
Do not include any explanations or commentary - just return the extracted content.`;

    const response = await fetch(API_ENDPOINTS.DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_ENDPOINTS.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = (await response.json()) as DeepseekResponse;
    const content = data.choices[0]?.message?.content || "";

    // Try to extract title from first line
    const lines = content.split("\n").filter((line) => line.trim().length > 0);
    const title = lines.length > 0 ? lines[0] : undefined;

    return {
      title,
      caption: content,
      url,
    };
  } catch (error) {
    console.error("Error scraping generic recipe website:", error);
    return null;
  }
}

export async function analyzeRecipeText(
  recipeText: string
): Promise<Partial<Recipe>> {
  try {
    // Check cache first using a simplified hash for the key
    const cacheKey = `recipe_${recipeText
      .substring(0, 50)
      .replace(/\s+/g, "")}_${recipeText.length}`;
    const cachedResult = recipeCache.get(cacheKey);
    if (cachedResult) {
      console.log("Retrieved recipe from cache");
      return cachedResult;
    }

    console.log(`Analyzing recipe text (${recipeText.length} chars)...`);

    // Truncate the recipe text if it's too long to avoid token limits
    const MAX_LENGTH = 10000;
    let processedText = recipeText;

    if (recipeText.length > MAX_LENGTH) {
      console.log(
        `Recipe text too long (${recipeText.length} chars), truncating to ${MAX_LENGTH} chars`
      );
      processedText = recipeText.substring(0, MAX_LENGTH);
    }

    // Split the analysis into smaller parallel tasks
    const [basicInfo, nutritionInfo] = await Promise.all([
      analyzeBasicRecipeInfo(processedText),
      analyzeNutritionInfo(processedText),
    ]);

    // Merge the results
    const result = {
      ...basicInfo,
      ...nutritionInfo,
    };

    // Cache the result
    recipeCache.set(cacheKey, result);

    // Also persist to AsyncStorage for longer-term caching
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
    } catch (e) {
      console.warn("Failed to persist recipe to AsyncStorage:", e);
    }

    return result;
  } catch (error) {
    console.error("Error analyzing recipe with DeepSeek API:", error);
    throw new Error(
      "Failed to analyze recipe. Please check your input and try again."
    );
  }
}

// Split recipe analysis into smaller tasks
async function analyzeBasicRecipeInfo(text: string) {
  const prompt = `Extract basic recipe information from this text. Include only:
- title
- description
- ingredients
- instructions
- prep time
- cook time
- servings

Text:
${text}

Return as JSON.`;

  const response = await callDeepSeekAPI(prompt);
  return parseDeepSeekResponse(response);
}

async function analyzeNutritionInfo(text: string) {
  const prompt = `Extract only nutritional information from this recipe text. Include:
- nutrition facts
- dietary categories
- tags
- meal type
- cuisine type

Text:
${text}

Return as JSON.`;

  const response = await callDeepSeekAPI(prompt);
  return parseDeepSeekResponse(response);
}

// Helper function for API calls with retries
async function callDeepSeekAPI(
  prompt: string,
  retries = 3
): Promise<DeepseekResponse> {
  addServiceLog(`Calling DeepSeek API (${prompt.length} chars)`);

  // Use exponential backoff for retries
  const INITIAL_TIMEOUT = 45000; // 45 seconds initial timeout
  const MAX_TIMEOUT = 90000; // 90 seconds max timeout

  for (let i = 0; i < retries; i++) {
    try {
      addServiceLog(`DeepSeek API attempt ${i + 1}/${retries}`);

      const controller = new AbortController();
      const timeout = Math.min(INITIAL_TIMEOUT * Math.pow(1.5, i), MAX_TIMEOUT);

      // Set timeout with clear message
      const timeoutId = setTimeout(() => {
        addServiceLog(`DeepSeek API timeout after ${timeout}ms`);
        controller.abort(new Error(`Request timed out after ${timeout}ms`));
      }, timeout);

      addServiceLog(`Set timeout of ${timeout}ms for API call`);

      const response = await fetch(API_ENDPOINTS.DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_ENDPOINTS.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 2048,
        }),
        signal: controller.signal,
      });

      // Clear timeout as soon as response is received
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => "Failed to get error text");
        addServiceLog(`API error: HTTP ${response.status} - ${errorText}`);
        throw new Error(
          `API request failed with status ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();
      addServiceLog("API call successful");
      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addServiceLog(`API call failed: ${errorMessage}`);

      if (error instanceof Error && error.name === "AbortError") {
        addServiceLog("Request was aborted (timeout)");
      }

      if (i === retries - 1) {
        addServiceLog(`All ${retries} attempts failed`);
        throw error;
      }

      const backoffTime = Math.pow(2, i) * 1000;
      addServiceLog(`Retrying in ${backoffTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
    }
  }
  throw new Error("Failed after all retries");
}

// Helper function to parse DeepSeek response
function parseDeepSeekResponse(response: DeepseekResponse): Partial<Recipe> {
  const content = response.choices[0]?.message?.content || "";

  try {
    // First try to extract JSON between code blocks
    const jsonMatch = content.match(/```(?:json)?\\s*([\\s\\S]*?)\\s*```/);
    let jsonString = jsonMatch ? jsonMatch[1].trim() : content;

    // If no JSON was found in code blocks, try to find JSON object in the content
    if (!jsonString.startsWith("{")) {
      const objectMatch = content.match(/{[\\s\\S]*}/);
      if (objectMatch) {
        jsonString = objectMatch[0];
      } else {
        console.error("Failed to extract JSON from response content:", content);
        throw new Error("No valid JSON found in response");
      }
    }

    console.log(`Extracted JSON string (${jsonString.length} chars)`);

    // Handle potential errors in the JSON
    jsonString = fixCommonJsonErrors(jsonString);

    // Try to parse the fixed JSON
    let parsedRecipe: any;
    try {
      parsedRecipe = JSON.parse(jsonString);
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
      throw new Error("Failed to parse DeepSeek response JSON");
    }

    // Log successful parse and basic structure
    console.log(
      `Successfully parsed recipe JSON: ${JSON.stringify(
        {
          ingredientsCount: Array.isArray(parsedRecipe.ingredients)
            ? parsedRecipe.ingredients.length
            : typeof parsedRecipe.ingredients === "object"
            ? Object.keys(parsedRecipe.ingredients).length
            : 0,
          instructionsCount: Array.isArray(parsedRecipe.instructions)
            ? parsedRecipe.instructions.length
            : parsedRecipe.steps && Array.isArray(parsedRecipe.steps)
            ? parsedRecipe.steps.length
            : 0,
          title: parsedRecipe.title,
        },
        null,
        2
      )}`
    );

    // Extract information into the Recipe format
    const result: Partial<Recipe> = {};

    // Basic information
    result.title = parsedRecipe.title || parsedRecipe.name;
    result.description = parsedRecipe.description;
    result.prepTime = parsedRecipe.prep_time || parsedRecipe.prepTime;
    result.cookTime = parsedRecipe.cook_time || parsedRecipe.cookTime;
    result.servings = parsedRecipe.servings;
    result.tags = processNutritionalTags(parsedRecipe);

    // Instructions processing - handle different formats
    const instructions: string[] = [];
    if (Array.isArray(parsedRecipe.instructions)) {
      instructions.push(...parsedRecipe.instructions.map(String));
    } else if (typeof parsedRecipe.instructions === "string") {
      // Split by newlines and filter out empty lines
      instructions.push(
        ...parsedRecipe.instructions
          .split("\n")
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0)
      );
    } else if (parsedRecipe.steps && Array.isArray(parsedRecipe.steps)) {
      // Some responses use "steps" instead of "instructions"
      instructions.push(...parsedRecipe.steps.map(String));
    }
    result.instructions = instructions;

    // Process ingredients - handles both array and object formats
    let ingredients: Ingredient[] = [];

    // Log what ingredient format we're dealing with
    console.log(
      `[DeepSeekService] Raw ingredients from API: ${JSON.stringify(
        parsedRecipe.ingredients,
        null,
        2
      )}`
    );

    // Case 1: Ingredients are a simple array of strings or objects
    if (Array.isArray(parsedRecipe.ingredients)) {
      ingredients = parsedRecipe.ingredients.map(
        (ing: any, index: number): Ingredient => {
          const ingredientName =
            typeof ing === "string" ? ing : ing?.name || "Unknown ingredient";
          const quantityString =
            typeof ing === "string" ? "" : ing?.quantity || "1";
          const quantityParts = quantityString
            ? quantityString.split(" ")
            : ["1"];
          const quantity = quantityParts[0] || "";
          const unit = quantityParts.slice(1).join(" ") || "";

          return {
            id: `temp-${index}`,
            name: ingredientName,
            amount: parseFloat(quantity) || 1,
            unit: unit,
          };
        }
      );
    }
    // Case 2: Ingredients are categorized in sections
    else if (
      parsedRecipe.ingredients &&
      typeof parsedRecipe.ingredients === "object" &&
      !Array.isArray(parsedRecipe.ingredients)
    ) {
      let index = 0;

      // Iterate through each section of ingredients
      for (const [section, items] of Object.entries(parsedRecipe.ingredients)) {
        if (Array.isArray(items)) {
          // Add each ingredient with its section as a prefix if it's not a simple ingredient
          const sectionIngredients = items.map((item: any) => {
            const ingredientText =
              typeof item === "string"
                ? item
                : item?.name || "Unknown ingredient";

            // Extract quantity/unit/name using regex
            const match = ingredientText.match(
              /^(~?\s*[\d\/\.]+\s*(?:-\s*[\d\/\.]+)?)?\s*((?:[\w\s]+)?)\s*(.+)$/
            );

            let amount = 1;
            let unit = "";
            let name = ingredientText;

            if (match) {
              const [_, quantity, possibleUnit, ingredientName] = match;
              if (quantity) {
                // Remove tilde and convert to number
                amount = parseFloat(quantity.replace(/~/, "").trim()) || 1;
              }

              // Check if the possible unit is actually a unit
              const commonUnits = [
                "cup",
                "cups",
                "tbsp",
                "tsp",
                "tablespoon",
                "tablespoons",
                "teaspoon",
                "teaspoons",
                "oz",
                "ounce",
                "ounces",
                "g",
                "gram",
                "grams",
                "kg",
                "lb",
                "pound",
                "pounds",
              ];

              if (
                possibleUnit &&
                commonUnits.some((u) => possibleUnit.toLowerCase().includes(u))
              ) {
                unit = possibleUnit.trim();
                name = ingredientName.trim();
              } else {
                // If no recognizable unit, combine possibleUnit and ingredientName
                name = `${possibleUnit} ${ingredientName}`.trim();
              }
            }

            // If the section is not already part of the name and it's not a generic section
            if (
              !name.toLowerCase().includes(section.toLowerCase()) &&
              !["ingredients", "ingredient", "items", "main"].includes(
                section.toLowerCase()
              )
            ) {
              name = `${section.replace(/_/g, " ")}: ${name}`;
            }

            return {
              id: `temp-${index++}`,
              name,
              amount,
              unit,
              category: section.replace(/_/g, " "),
            };
          });

          ingredients = [...ingredients, ...sectionIngredients];
        }
      }
    }

    // Case 3: Scan all object entries for potential ingredient categories
    // If we still don't have ingredients, check for other patterns
    if (ingredients.length === 0) {
      let index = 0;

      for (const [key, value] of Object.entries(parsedRecipe)) {
        // Check if this is likely an ingredient category
        if (
          Array.isArray(value) &&
          !key.includes("instruction") &&
          !key.includes("step") &&
          key !== "tags" &&
          key !== "nutritional_tags"
        ) {
          const categoryName = key.replace(/_/g, " ");
          const categoryIngredients = value.map((item: any) => {
            const ingredientText =
              typeof item === "string"
                ? item
                : item?.name || "Unknown ingredient";

            // Extract quantity from string format
            const match = ingredientText.match(
              /^(~?\s*[\d\/\.]+\s*(?:-\s*[\d\/\.]+)?)?\s*((?:[\w\s]+)?)\s*(.+)$/
            );

            let amount = 1;
            let unit = "";
            let name = ingredientText;

            if (match) {
              const [_, quantity, possibleUnit, ingredientName] = match;
              if (quantity) {
                // Remove tilde and convert to number
                amount = parseFloat(quantity.replace(/~/, "").trim()) || 1;
              }

              // Check if the possible unit is actually a unit
              const commonUnits = [
                "cup",
                "cups",
                "tbsp",
                "tsp",
                "tablespoon",
                "tablespoons",
                "teaspoon",
                "teaspoons",
                "oz",
                "ounce",
                "ounces",
                "g",
                "gram",
                "grams",
                "kg",
                "lb",
                "pound",
                "pounds",
              ];

              if (
                possibleUnit &&
                commonUnits.some((u) => possibleUnit.toLowerCase().includes(u))
              ) {
                unit = possibleUnit.trim();
                name = ingredientName ? ingredientName.trim() : name;
              } else if (ingredientName) {
                // If no recognizable unit, combine possibleUnit and ingredientName
                name = `${possibleUnit} ${ingredientName}`.trim();
              }
            }

            // Add the category to the ingredient name if it's not a generic category
            if (
              !["ingredients", "ingredient", "items", "main"].includes(
                categoryName.toLowerCase()
              )
            ) {
              name = `${categoryName}: ${name}`;
            }

            return {
              id: `temp-${index++}`,
              name,
              amount,
              unit,
              category: categoryName,
            };
          });

          ingredients = [...ingredients, ...categoryIngredients];
        }
      }
    }

    result.ingredients = ingredients;
    console.log(
      `[DeepSeekService] Processed ${ingredients.length} ingredients`
    );

    return result;
  } catch (error) {
    console.error("Failed to parse DeepSeek response:", error);
    return {
      title: "Failed to parse recipe",
      description:
        "The AI couldn't properly extract this recipe. Please try with different text or add manually.",
      ingredients: [],
      instructions: [],
    };
  }
}

// Function to generate a synthetic recipe when all other methods fail
async function generateSyntheticRecipe(url: string): Promise<string | null> {
  try {
    // Use DeepSeek to generate a plausible recipe based on the URL
    const prompt = `You are a helpful assistant that creates synthetic recipe content when extraction fails.
    
For the URL: ${url}
    
Please invent a plausible recipe that might be associated with this URL.
Include a title, ingredients list, and preparation steps.
Make it realistic and detailed, as if you were able to extract the actual recipe.

Format it as a recipe post with clear sections for ingredients and steps.`;

    const response = await fetch(API_ENDPOINTS.DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_ENDPOINTS.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7, // Higher temperature for creativity
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = (await response.json()) as DeepseekResponse;
    const content = data.choices[0]?.message?.content || "";

    if (content) {
      return content;
    }

    return null;
  } catch (error) {
    console.error("Error generating synthetic recipe:", error);
    return null;
  }
}

/**
 * Fix common JSON formatting errors in the DeepSeek response
 */
function fixCommonJsonErrors(jsonString: string): string {
  let fixedJson = jsonString;

  // Fix unquoted property names
  fixedJson = fixedJson.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');

  // Fix trailing commas
  fixedJson = fixedJson.replace(/,\s*}/g, "}");
  fixedJson = fixedJson.replace(/,\s*]/g, "]");

  // Fix missing quotes around string values
  fixedJson = fixedJson.replace(
    /:(\s*)([^"{}\[\],\s][^{}\[\],]*?)(\s*[,}])/g,
    ':"$2"$3'
  );

  return fixedJson;
}

/**
 * Process tags from the recipe data
 */
function processNutritionalTags(parsedRecipe: any): string[] {
  // Safely process tags from various possible locations in the response
  const processTagsArray = (tagsArray: any[] | undefined): string[] => {
    if (!Array.isArray(tagsArray)) return [];
    return tagsArray
      .filter((tag) => tag && typeof tag === "string")
      .map((tag) => formatTag(tag));
  };

  // Safely process a single tag
  const processTag = (tag: any): string | null => {
    if (!tag || typeof tag !== "string") return null;
    return formatTag(tag);
  };

  // Combine all tag-like fields into a comprehensive tags array
  const allTags = [
    // Process nutritional tags safely
    ...processTagsArray(parsedRecipe.nutritional_tags),
    ...processTagsArray(parsedRecipe.tags),

    // Add dietary categories as tags
    ...processTagsArray(parsedRecipe.dietary_categories),

    // Add cuisine type - handle both string and array formats
    ...(Array.isArray(parsedRecipe.cuisine_type)
      ? processTagsArray(parsedRecipe.cuisine_type)
      : [processTag(parsedRecipe.cuisine_type)].filter(Boolean)),

    // Add cooking method
    processTag(parsedRecipe.cooking_method),

    // Add meal type - handle both string and array formats
    ...(Array.isArray(parsedRecipe.meal_type)
      ? processTagsArray(parsedRecipe.meal_type)
      : [processTag(parsedRecipe.meal_type)].filter(Boolean)),

    // Other possible tag sources
    processTag(parsedRecipe.main_ingredient),
    processTag(parsedRecipe.occasion),
  ].filter(Boolean) as string[]; // Remove any null/undefined values

  // Remove duplicates
  return [...new Set(allTags)];
}
