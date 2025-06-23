import { Recipe, Ingredient } from "../types";
import { supabase } from "@/lib/supabase";
import { API_ENDPOINTS } from "@/constants/api";
import {
  scrapeFromUrl,
  analyzeRecipeText,
  ScrapedContent,
  addServiceLog,
  extractRecipeFromUrl as extractWithStructuredData,
} from "./deepseekservice";
import { formatTag } from "./utils";
import {
  extractStructuredRecipeData,
  transformStructuredDataToRecipe,
  StructuredRecipeData,
} from "./structuredDataExtractor";
import { processRecipeImageUrl } from "../utils/imageProcessor";

// Use the API URL from the constants file
const RECIPE_EXTRACTION_SERVICE_URL =
  API_ENDPOINTS.RECIPE_EXTRACTION_SERVICE_URL;

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

/**
 * Enhanced recipe extraction with structured data priority
 * Following rules.md: Prioritize structured data, fallback to AI analysis
 */
export async function extractRecipeFromUrl(url: string): Promise<Recipe> {
  try {
    addServiceLog(`Starting enhanced recipe extraction for: ${url}`);

    // NEW: Use the advanced structured data extraction method first
    try {
      const extractedRecipe = await extractWithStructuredData(url);
      if (
        extractedRecipe &&
        extractedRecipe.title &&
        extractedRecipe.ingredients &&
        extractedRecipe.ingredients.length > 0
      ) {
        addServiceLog(
          `Successfully extracted recipe using new structured data method: ${extractedRecipe.title} with ${extractedRecipe.ingredients.length} ingredients`
        );

        return {
          id: generateRecipeId(),
          title: extractedRecipe.title,
          description: extractedRecipe.description || "",
          ingredients: extractedRecipe.ingredients,
          instructions: extractedRecipe.instructions || [],
          prepTime: extractedRecipe.prepTime || 0,
          cookTime: extractedRecipe.cookTime || 0,
          servings: extractedRecipe.servings || 4,
          imageUrl: extractedRecipe.imageUrl,
          sourceUrl: url,
          author: extractedRecipe.author,
          tags: extractedRecipe.tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Recipe;
      }
    } catch (structuredDataError) {
      addServiceLog(
        `Structured data extraction failed, falling back to legacy method: ${
          structuredDataError instanceof Error
            ? structuredDataError.message
            : String(structuredDataError)
        }`
      );
    }

    // FALLBACK: Try the original structured data extraction method
    const { structuredData, fallbackText } = await extractStructuredRecipeData(
      url
    );

    if (structuredData) {
      addServiceLog(
        "Found structured recipe data using legacy method, transforming to Recipe format"
      );

      // Get the best image from the structured data or scraped content
      const imageUrl = await selectBestImageForRecipe(url, structuredData);

      // Transform structured data to Recipe format
      const recipe = transformStructuredDataToRecipe(
        structuredData,
        url,
        imageUrl
      );

      // Ensure we have all required fields
      if (recipe.title && recipe.ingredients && recipe.ingredients.length > 0) {
        addServiceLog(
          `Successfully extracted recipe with ${recipe.ingredients.length} ingredients from legacy structured data`
        );

        return {
          id: generateRecipeId(),
          title: recipe.title,
          description: recipe.description || "",
          ingredients: recipe.ingredients,
          instructions: recipe.instructions || [],
          prepTime: recipe.prepTime || 0,
          cookTime: recipe.cookTime || 0,
          servings: recipe.servings || 4,
          imageUrl: recipe.imageUrl,
          sourceUrl: url,
          author: recipe.author,
          tags: recipe.tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Recipe;
      } else {
        addServiceLog(
          "Legacy structured data incomplete, falling back to AI analysis"
        );
      }
    } else {
      addServiceLog(
        "No structured data found using legacy method, using AI analysis"
      );
    }

    // FINAL FALLBACK: AI analysis of text content
    if (fallbackText) {
      addServiceLog("Analyzing recipe text with AI");
      const aiAnalyzedRecipe = await analyzeRecipeText(fallbackText);

      // Get the best image for the recipe
      const imageUrl = await selectBestImageForRecipe(url);

      return {
        id: generateRecipeId(),
        title: aiAnalyzedRecipe.title || "Untitled Recipe",
        description: aiAnalyzedRecipe.description || "",
        ingredients: aiAnalyzedRecipe.ingredients || [],
        instructions: aiAnalyzedRecipe.instructions || [],
        prepTime: aiAnalyzedRecipe.prepTime || 0,
        cookTime: aiAnalyzedRecipe.cookTime || 0,
        servings: aiAnalyzedRecipe.servings || 4,
        imageUrl,
        sourceUrl: url,
        author: aiAnalyzedRecipe.author,
        tags: aiAnalyzedRecipe.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Recipe;
    }

    throw new Error("No recipe content could be extracted from the URL");
  } catch (error) {
    addServiceLog(
      `Recipe extraction failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
}

/**
 * Select the best image for a recipe from structured data or scraped content
 */
async function selectBestImageForRecipe(
  url: string,
  structuredData?: StructuredRecipeData
): Promise<string | undefined> {
  // Priority 1: Image from structured data
  if (structuredData?.image) {
    const imageData = Array.isArray(structuredData.image)
      ? structuredData.image[0]
      : structuredData.image;
    const imageUrl =
      typeof imageData === "string" ? imageData : (imageData as any)?.url;

    if (imageUrl) {
      return processImageUrlForRecipe(imageUrl);
    }
  }

  // Priority 2: Scrape images from the page
  try {
    const extractionServiceUrl = API_ENDPOINTS.RECIPE_EXTRACTION_SERVICE_URL;
    if (!extractionServiceUrl) {
      return undefined;
    }

    const response = await fetch(`${extractionServiceUrl}/api/scrape-web`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        options: {
          text: false,
          metadata: true,
          images: true,
          headings: false,
          links: false,
          tables: false,
          forms: false,
        },
      }),
    });

    if (response.ok) {
      const scrapedData = await response.json();
      // Select the best image from scraped data
      let bestImage = null;

      // Priority 1: Open Graph image
      if (scrapedData.metadata?.open_graph?.image) {
        bestImage = scrapedData.metadata.open_graph.image;
      }
      // Priority 2: First scraped image
      else if (scrapedData.images?.images?.[0]?.url) {
        bestImage = scrapedData.images.images[0].url;
      }

      if (bestImage) {
        return processImageUrlForRecipe(bestImage);
      }
    }
  } catch (error) {
    addServiceLog(
      `Failed to scrape images: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  return undefined;
}

/**
 * Process image URL with proxy for Instagram CDN URLs
 */
function processImageUrlForRecipe(imageUrl: string): string {
  // Use the unified image processor
  return processRecipeImageUrl(imageUrl) || imageUrl;
}

/**
 * Generate a unique recipe ID
 */
export function generateRecipeId(): string {
  return `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Enhanced Instagram extraction that fully utilizes Open Graph data
 * This matches the rich data available from the backend scraping
 */
export async function extractRecipeFromInstagram(
  username: string,
  postId: string
): Promise<Partial<Recipe>> {
  try {
    // Create a tracking ID
    const extractionId = `instagram_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    addServiceLog(
      `[${extractionId}] Starting enhanced Instagram extraction for @${username}, post ID: ${postId}`
    );

    // Build the Instagram post URL
    const url = `https://www.instagram.com/p/${postId}/`;
    addServiceLog(`[${extractionId}] Instagram URL: ${url}`);

    // Use the optimized scraping to get rich Open Graph data
    const scrapingResult = await testInstagramScraping(url);

    if (scrapingResult.success && scrapingResult.extractedData) {
      const {
        caption,
        username: extractedUsername,
        thumbnail,
      } = scrapingResult.extractedData;

      addServiceLog(
        `[${extractionId}] Extracted rich data - Caption: ${
          caption.length
        } chars, Username: ${extractedUsername}, Thumbnail: ${!!thumbnail}`
      );

      // Extract title from Open Graph title (contains the actual post title)
      let recipeTitle = "Instagram Recipe";
      const rawData = scrapingResult.rawResponse;

      if (rawData?.metadata?.open_graph?.title) {
        // Extract the actual recipe title from the Open Graph title
        // Format: "Username on Instagram: "Recipe Title..."
        const ogTitle = rawData.metadata.open_graph.title;
        const titleMatch = ogTitle.match(/on Instagram: "([^"]+)/);
        if (titleMatch && titleMatch[1]) {
          // Extract the first line which is usually the recipe title
          const firstLine = titleMatch[1].split("\n")[0].trim();
          if (firstLine && firstLine.length > 3) {
            recipeTitle = firstLine.replace(/[🔥🌿🐓]/g, "").trim(); // Remove emojis
          }
        }
      }

      // Check if we have substantial recipe content
      if (caption && caption.length > 100) {
        addServiceLog(
          `[${extractionId}] Found substantial recipe content, analyzing with AI`
        );

        try {
          // Use AI to analyze the full caption and extract structured recipe data
          const aiAnalyzedRecipe = await analyzeRecipeText(caption);

          // Process the thumbnail image URL if available
          let processedImageUrl = undefined;
          if (thumbnail) {
            try {
              processedImageUrl = await processRecipeImageUrl(thumbnail);
              addServiceLog(`[${extractionId}] Image processed successfully`);
            } catch (imageError) {
              addServiceLog(
                `[${extractionId}] Image processing failed, using original: ${
                  imageError instanceof Error
                    ? imageError.message
                    : String(imageError)
                }`
              );
              processedImageUrl = thumbnail; // Use original if processing fails
            }
          }

          // Create a comprehensive recipe from the AI analysis with enhanced metadata
          const instagramRecipe: Partial<Recipe> = {
            id: generateRecipeId(),
            title: aiAnalyzedRecipe.title || recipeTitle,
            description:
              aiAnalyzedRecipe.description ||
              `Delicious recipe from @${
                extractedUsername || username
              }. ${caption.substring(0, 200)}${
                caption.length > 200 ? "..." : ""
              }`,
            imageUrl: processedImageUrl,
            author: extractedUsername || username,
            sourceUrl: url,
            ingredients:
              aiAnalyzedRecipe.ingredients &&
              aiAnalyzedRecipe.ingredients.length > 0
                ? aiAnalyzedRecipe.ingredients
                : [
                    {
                      id: "instagram-extracted-1",
                      name: "See full recipe in Instagram post caption",
                      amount: 1,
                      unit: "item",
                    },
                  ],
            instructions:
              aiAnalyzedRecipe.instructions &&
              aiAnalyzedRecipe.instructions.length > 0
                ? aiAnalyzedRecipe.instructions
                : ["Full recipe details from Instagram:", caption],
            prepTime: aiAnalyzedRecipe.prepTime || 0,
            cookTime: aiAnalyzedRecipe.cookTime || 0,
            servings: aiAnalyzedRecipe.servings || 4,
            tags: (() => {
              // Import the enhanced tag filtering
              const { filterFoodTags } = require("./tagUtils");

              // Combine AI-generated tags with source metadata, then filter
              const allTags = [
                ...(aiAnalyzedRecipe.tags || []),
                // Only add source info if it passes food validation
                "Social Media Recipe", // More generic than "Instagram"
              ];

              // Apply enhanced filtering to remove non-food tags
              const filteredTags = filterFoodTags(allTags);

              console.log(
                `[RecipeExtractor] Tag filtering: ${allTags.length} → ${filteredTags.length} tags`
              );
              console.log(
                `[RecipeExtractor] Filtered out: [${allTags
                  .filter((t: string) => !filteredTags.includes(t))
                  .map((t: string) => `"${t}"`)
                  .join(", ")}]`
              );
              console.log(
                `[RecipeExtractor] Final tags: [${filteredTags
                  .map((t: string) => `"${t}"`)
                  .join(", ")}]`
              );

              return filteredTags;
            })(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          addServiceLog(
            `[${extractionId}] Successfully created enhanced recipe:
Title: "${instagramRecipe.title}"
Ingredients: ${instagramRecipe.ingredients?.length || 0}
Instructions: ${instagramRecipe.instructions?.length || 0}
Author: @${instagramRecipe.author}
Image: ${instagramRecipe.imageUrl ? "✅" : "❌"}`
          );

          return instagramRecipe;
        } catch (aiError) {
          addServiceLog(
            `[${extractionId}] AI analysis failed: ${
              aiError instanceof Error ? aiError.message : String(aiError)
            }`
          );

          // Enhanced fallback with better title extraction
          const basicRecipe: Partial<Recipe> = {
            id: generateRecipeId(),
            title:
              recipeTitle !== "Instagram Recipe"
                ? recipeTitle
                : `Recipe from @${extractedUsername || username}`,
            description:
              caption.substring(0, 300) + (caption.length > 300 ? "..." : ""),
            imageUrl: thumbnail || undefined,
            author: extractedUsername || username,
            sourceUrl: url,
            ingredients: [
              {
                id: "instagram-basic-1",
                name: "See Instagram post for full ingredient list",
                amount: 1,
                unit: "item",
              },
            ],
            instructions: ["Full recipe from Instagram post:", caption],
            prepTime: 0,
            cookTime: 0,
            servings: 4,
            tags: (() => {
              // Apply enhanced filtering to remove non-food tags
              const { filterFoodTags } = require("./tagUtils");
              // Don't add any source metadata tags since they get filtered out
              // Just return empty array for fallback recipes
              return [];
            })(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          addServiceLog(
            `[${extractionId}] Created enhanced basic recipe as fallback`
          );
          return basicRecipe;
        }
      } else {
        addServiceLog(
          `[${extractionId}] Caption too short: "${caption.substring(
            0,
            100
          )}..."`
        );
      }
    }

    // If Instagram scraping didn't work, try the general extraction method
    addServiceLog(
      `[${extractionId}] Attempting general recipe extraction from Instagram URL`
    );

    try {
      const recipe = await extractRecipeFromUrl(url);
      addServiceLog(
        `[${extractionId}] General extraction successful: ${recipe.title}`
      );
      return recipe;
    } catch (extractionError) {
      addServiceLog(
        `[${extractionId}] General extraction failed: ${
          extractionError instanceof Error
            ? extractionError.message
            : String(extractionError)
        }`
      );

      // Try alternative URL formats
      const alternativeUrls = [
        `https://www.instagram.com/reel/${postId}/`,
        `https://www.instagram.com/tv/${postId}/`,
      ];

      for (const altUrl of alternativeUrls) {
        try {
          addServiceLog(`[${extractionId}] Trying alternative URL: ${altUrl}`);
          const fallbackRecipe = await extractRecipeFromUrl(altUrl);
          addServiceLog(
            `[${extractionId}] Alternative URL extraction successful`
          );
          return fallbackRecipe;
        } catch (altError) {
          addServiceLog(
            `[${extractionId}] Alternative URL failed: ${
              altError instanceof Error ? altError.message : String(altError)
            }`
          );
        }
      }

      // Final fallback: Create a minimal recipe with instructions to check Instagram
      addServiceLog(
        `[${extractionId}] All extraction methods failed, creating minimal recipe`
      );

      const minimalRecipe: Partial<Recipe> = {
        id: generateRecipeId(),
        title: `Instagram Recipe from @${username}`,
        description: `This recipe was shared on Instagram but couldn't be automatically extracted. Please visit the original post for the full recipe details.`,
        imageUrl: undefined,
        author: username,
        sourceUrl: url,
        ingredients: [
          {
            id: "instagram-manual-1",
            name: "Please check the Instagram post for ingredients",
            amount: 1,
            unit: "item",
          },
        ],
        instructions: [
          `Visit the original Instagram post to see the full recipe: ${url}`,
          "Instagram posts often contain recipe details in the caption or in carousel images.",
          "Look for ingredient lists, cooking steps, and any additional tips from the creator.",
        ],
        prepTime: 0,
        cookTime: 0,
        servings: 1,
        tags: (() => {
          // Apply enhanced filtering to remove non-food tags
          const { filterFoodTags } = require("./tagUtils");
          // Don't add any source metadata tags since they get filtered out
          // Just return empty array for fallback recipes
          return [];
        })(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addServiceLog(
        `[${extractionId}] Created minimal recipe as final fallback`
      );
      return minimalRecipe;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addServiceLog(`[Instagram extraction] Complete failure: ${errorMessage}`);

    // Provide more specific error messages for common issues
    if (
      errorMessage.includes("Network request failed") ||
      errorMessage.includes("fetch") ||
      errorMessage.includes("ENOTFOUND") ||
      errorMessage.includes("ECONNREFUSED")
    ) {
      throw new Error(
        "Network error: Unable to connect to Instagram. Please check your internet connection and try again."
      );
    } else if (errorMessage.includes("timeout")) {
      throw new Error(
        "Request timeout: Instagram took too long to respond. Please try again later."
      );
    } else if (
      errorMessage.includes("404") ||
      errorMessage.includes("not found")
    ) {
      throw new Error(
        "Instagram post not found. Please check the URL and make sure the post is public and still available."
      );
    } else if (
      errorMessage.includes("403") ||
      errorMessage.includes("forbidden") ||
      errorMessage.includes("401") ||
      errorMessage.includes("unauthorized")
    ) {
      throw new Error(
        "Access denied: Instagram is blocking automated access. This is common with Instagram's anti-bot measures. Please try copying the recipe manually or use a different source."
      );
    } else {
      throw new Error(
        `Instagram extraction failed: ${errorMessage}. Instagram heavily protects their content, so automatic extraction may not always work. Please consider copying the recipe manually.`
      );
    }
  }
}

/**
 * Validate that a recipe has the minimal required fields
 */
export function validateRecipe(recipe: Partial<Recipe>): string[] {
  const errors: string[] = [];

  // Check required fields
  if (!recipe.title) {
    errors.push("Recipe must have a title");
  } else {
    // Check for generic placeholder titles
    const genericTitles = [
      "recipe name",
      "untitled recipe",
      "recipe extraction failed",
      "failed to parse recipe",
      "instagram recipe",
    ];

    const titleLower = recipe.title.toLowerCase().trim();
    if (genericTitles.some((generic) => titleLower.includes(generic))) {
      errors.push(
        "Recipe has a generic placeholder title - extraction may have failed"
      );
    }
  }

  // Check for generic placeholder descriptions
  if (recipe.description) {
    const genericDescriptions = [
      "brief description",
      "the ai couldn't properly extract",
      "extraction may have failed",
      "please try again or add manually",
    ];

    const descriptionLower = recipe.description.toLowerCase().trim();
    if (
      genericDescriptions.some((generic) => descriptionLower.includes(generic))
    ) {
      errors.push(
        "Recipe has a generic placeholder description - extraction may have failed"
      );
    }
  }

  // For ingredients, check if we have an array and it's not empty
  if (
    !recipe.ingredients ||
    !Array.isArray(recipe.ingredients) ||
    recipe.ingredients.length === 0
  ) {
    errors.push("Recipe must have at least one ingredient");
  } else {
    // Check for generic placeholder ingredients
    const hasOnlyGenericIngredients = recipe.ingredients.every((ingredient) => {
      const name = ingredient.name?.toLowerCase() || "";
      return (
        name.includes("see full recipe") ||
        name.includes("see instagram post") ||
        name.includes("unknown ingredient") ||
        name.includes("manual extraction needed") ||
        name.includes("please check")
      );
    });

    if (hasOnlyGenericIngredients) {
      errors.push(
        "Recipe contains only generic placeholder ingredients - extraction failed"
      );
    }
  }

  // For instructions, check if we have an array and it's not empty
  if (
    !recipe.instructions ||
    !Array.isArray(recipe.instructions) ||
    recipe.instructions.length === 0
  ) {
    errors.push("Recipe must have at least one instruction");
  } else {
    // Check for generic placeholder instructions
    const hasOnlyGenericInstructions = recipe.instructions.every(
      (instruction) => {
        const instructionLower = instruction.toLowerCase();
        return (
          instructionLower.includes("see original instagram post") ||
          instructionLower.includes("visit the original instagram post") ||
          instructionLower.includes("manual extraction needed") ||
          instructionLower.includes("full recipe details from instagram")
        );
      }
    );

    if (hasOnlyGenericInstructions) {
      errors.push(
        "Recipe contains only generic placeholder instructions - extraction failed"
      );
    }
  }

  return errors;
}

/**
 * Normalize recipe data for consistency
 */
export function normalizeRecipe(recipe: Partial<Recipe>): Partial<Recipe> {
  const normalized: Partial<Recipe> = { ...recipe };

  // Ensure title has sane default
  normalized.title = recipe.title || recipe.name || "Untitled Recipe";

  // Ensure ingredients is always an array
  if (!normalized.ingredients || !Array.isArray(normalized.ingredients)) {
    normalized.ingredients = [];
  }

  // Ensure instructions is always an array
  if (!normalized.instructions || !Array.isArray(normalized.instructions)) {
    normalized.instructions = [];

    // Try to extract instructions from different formats
    // Check if instructions exist as a string and split into array
    const instructionsAsString = recipe.instructions as unknown as string;
    if (typeof recipe.instructions === "string") {
      normalized.instructions = instructionsAsString
        .split("\n")
        .filter((line: string) => line.trim().length > 0)
        .map((line: string, index: number) =>
          line.trim().startsWith(String(index + 1))
            ? line.trim()
            : `${index + 1}. ${line.trim()}`
        );
    }
    // Check if there's a steps array in the raw data
    else if (
      recipe.hasOwnProperty("steps") &&
      Array.isArray((recipe as any).steps)
    ) {
      normalized.instructions = (recipe as any).steps.map(String);
    }
  }

  // Ensure cooking time fields are numbers
  normalized.prepTime =
    typeof recipe.prepTime === "number" ? recipe.prepTime : 0;
  normalized.cookTime =
    typeof recipe.cookTime === "number" ? recipe.cookTime : 0;
  normalized.servings =
    typeof recipe.servings === "number" ? recipe.servings : 2;

  // Ensure we have a created/updated timestamp
  const now = new Date().toISOString();
  normalized.createdAt = recipe.createdAt || now;
  normalized.updatedAt = recipe.updatedAt || now;

  return normalized;
}

/**
 * Determines the most appropriate category for a recipe based on various factors
 */
function determineRecipeCategory(
  mealType?: string,
  cuisineType?: string,
  mainIngredient?: string,
  cookingMethod?: string
): string {
  // Default to the meal type as the category if available
  if (mealType) {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
  }

  // If no meal type, use cuisine type
  if (cuisineType) {
    return cuisineType.charAt(0).toUpperCase() + cuisineType.slice(1);
  }

  // If no cuisine type, try to categorize by main ingredient
  if (mainIngredient) {
    switch (mainIngredient.toLowerCase()) {
      case "chicken":
      case "beef":
      case "pork":
      case "fish":
        return "Meat & Fish";
      case "vegetables":
        return "Vegetarian";
      case "pasta":
        return "Pasta";
      case "rice":
        return "Rice & Grains";
      default:
        return "Main";
    }
  }

  // Last resort, use cooking method
  if (cookingMethod) {
    switch (cookingMethod.toLowerCase()) {
      case "bake":
        return "Baked Goods";
      case "grill":
        return "Grilled";
      case "slow_cook":
        return "Slow Cooker";
      default:
        return "Main";
    }
  }

  // If all else fails
  return "Main";
}

// formatTag function moved to utils.ts

/**
 * Test the new web scraping and recipe validation flow
 */
export async function testWebScrapingFlow(url: string): Promise<{
  success: boolean;
  message: string;
  recipe?: Partial<Recipe>;
  validationErrors?: string[];
}> {
  try {
    addServiceLog(`Testing web scraping flow for URL: ${url}`);

    const recipe = await extractRecipeFromUrl(url);
    const validationErrors = validateRecipe(recipe);

    if (validationErrors.length > 0) {
      return {
        success: false,
        message: `Recipe validation failed: ${validationErrors.join(", ")}`,
        recipe,
        validationErrors,
      };
    }

    return {
      success: true,
      message: `Recipe extraction and validation successful! Title: "${
        recipe.title
      }", Ingredients: ${recipe.ingredients?.length || 0}, Instructions: ${
        recipe.instructions?.length || 0
      }`,
      recipe,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addServiceLog(`Test failed: ${errorMessage}`);

    return {
      success: false,
      message: `Test failed: ${errorMessage}`,
    };
  }
}

/**
 * NEW: Test Instagram scraping with /extract-enhanced endpoint
 * This function uses the simplified Instagram extraction API
 */
export async function testInstagramScraping(url: string): Promise<{
  success: boolean;
  message: string;
  scrapedData?: any;
  extractedData?: {
    caption: string;
    username: string;
    thumbnail: string | null;
  };
  rawResponse?: any;
}> {
  try {
    addServiceLog(
      `Starting Instagram extraction with extract-enhanced for: ${url}`
    );

    // Validate it's an Instagram URL
    if (!url.includes("instagram.com")) {
      return {
        success: false,
        message: "URL is not an Instagram URL",
      };
    }

    // Use the extract-enhanced endpoint
    const response = await fetch(
      `${RECIPE_EXTRACTION_SERVICE_URL}/api/extract-enhanced`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      }
    );

    if (!response.ok) {
      return {
        success: false,
        message: `Extract API Error: ${response.status} ${response.statusText}`,
      };
    }

    const result = await response.json();

    if (result.success) {
      // Extract the structured data directly from the API response
      const extractedData = {
        caption: result.data.caption,
        username:
          result.data.metadata?.og_title?.split(" on Instagram")[0] ||
          "Unknown",
        thumbnail: result.data.metadata?.og_image || null,
      };

      addServiceLog(`Instagram extract-enhanced completed: {
        "caption_length": ${extractedData.caption.length},
        "username": "${extractedData.username}",
        "has_thumbnail": ${!!extractedData.thumbnail}
      }`);

      return {
        success: true,
        message: "Instagram extraction successful with extract-enhanced",
        scrapedData: result.data,
        extractedData,
        rawResponse: result.data,
      };
    } else {
      return {
        success: false,
        message: result.error || "Failed to extract Instagram data",
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addServiceLog(`Instagram extract-enhanced failed: ${errorMessage}`);

    return {
      success: false,
      message: `Instagram extraction failed: ${errorMessage}`,
    };
  }
}

/**
 * Test multiple Instagram URLs and compare results
 */
export async function testMultipleInstagramUrls(urls: string[]): Promise<{
  success: boolean;
  results: Array<{
    url: string;
    success: boolean;
    caption?: string;
    username?: string;
    thumbnail?: string | null;
    error?: string;
  }>;
}> {
  const results = [];

  for (const url of urls) {
    try {
      const testResult = await testInstagramScraping(url);

      if (testResult.success && testResult.extractedData) {
        results.push({
          url,
          success: true,
          caption: testResult.extractedData.caption,
          username: testResult.extractedData.username,
          thumbnail: testResult.extractedData.thumbnail,
        });
      } else {
        results.push({
          url,
          success: false,
          error: testResult.message,
        });
      }
    } catch (error) {
      results.push({
        url,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Add a small delay between requests to be polite
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return {
    success: true,
    results,
  };
}

/**
 * User-assisted Instagram recipe extraction
 * When automatic extraction fails, this function can parse manually copied content
 */
export async function extractRecipeFromInstagramCaption(
  caption: string,
  username: string,
  postUrl: string,
  imageUrl?: string
): Promise<Partial<Recipe>> {
  try {
    addServiceLog(
      `Starting user-assisted Instagram extraction for @${username}`
    );

    if (!caption || caption.trim().length < 10) {
      throw new Error("Caption is too short to extract a meaningful recipe");
    }

    // Use AI to analyze the caption and extract recipe data
    const aiAnalyzedRecipe = await analyzeRecipeText(caption);

    // Create a recipe from the analyzed caption
    const recipe: Partial<Recipe> = {
      id: generateRecipeId(),
      title: aiAnalyzedRecipe.title || `Recipe from @${username}`,
      description:
        aiAnalyzedRecipe.description || caption.substring(0, 200) + "...",
      ingredients: aiAnalyzedRecipe.ingredients || [
        {
          id: "manual-ingredient-1",
          name: "See original Instagram post for ingredients",
          amount: 1,
          unit: "item",
        },
      ],
      instructions: aiAnalyzedRecipe.instructions || [
        "See original Instagram post for detailed instructions",
        caption,
      ],
      prepTime: aiAnalyzedRecipe.prepTime || 0,
      cookTime: aiAnalyzedRecipe.cookTime || 0,
      servings: aiAnalyzedRecipe.servings || 2,
      imageUrl: imageUrl,
      sourceUrl: postUrl,
      author: username,
      tags: (() => {
        // Import the enhanced tag filtering
        const { filterFoodTags } = require("./tagUtils");

        // Combine AI-generated tags with source metadata, then filter
        const allTags = [
          ...(aiAnalyzedRecipe.tags || []),
          // Only add source info if it passes food validation
          "Social Media Recipe", // More generic than "Instagram"
        ];

        // Apply enhanced filtering to remove non-food tags
        const filteredTags = filterFoodTags(allTags);

        console.log(
          `[RecipeExtractor] Tag filtering: ${allTags.length} → ${filteredTags.length} tags`
        );
        console.log(
          `[RecipeExtractor] Filtered out: [${allTags
            .filter((t: string) => !filteredTags.includes(t))
            .map((t: string) => `"${t}"`)
            .join(", ")}]`
        );
        console.log(
          `[RecipeExtractor] Final tags: [${filteredTags
            .map((t: string) => `"${t}"`)
            .join(", ")}]`
        );

        return filteredTags;
      })(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addServiceLog(`Successfully created recipe from user-provided caption`);
    return recipe;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addServiceLog(`User-assisted extraction failed: ${errorMessage}`);
    throw new Error(`Failed to extract recipe from caption: ${errorMessage}`);
  }
}

/**
 * Enhanced Instagram extraction with user-assisted fallback
 */
export async function extractRecipeFromInstagramWithFallback(
  username: string,
  postId: string,
  userProvidedCaption?: string,
  userProvidedImageUrl?: string
): Promise<Partial<Recipe>> {
  const url = `https://www.instagram.com/p/${postId}/`;

  // First try automatic extraction
  try {
    return await extractRecipeFromInstagram(username, postId);
  } catch (automaticError) {
    addServiceLog(`Automatic extraction failed, trying user-assisted approach`);

    // If user provided caption, use it
    if (userProvidedCaption) {
      return await extractRecipeFromInstagramCaption(
        userProvidedCaption,
        username,
        url,
        userProvidedImageUrl
      );
    }

    // Otherwise, create a minimal recipe with instructions for manual extraction
    const minimalRecipe: Partial<Recipe> = {
      id: generateRecipeId(),
      title: `Instagram Recipe from @${username}`,
      description: `This recipe was shared on Instagram but couldn't be automatically extracted. Please use the manual extraction feature to add the recipe details.`,
      imageUrl: userProvidedImageUrl,
      author: username,
      sourceUrl: url,
      ingredients: [
        {
          id: "manual-extraction-needed",
          name: "Manual extraction needed - see instructions",
          amount: 1,
          unit: "item",
        },
      ],
      instructions: [
        "🔄 MANUAL EXTRACTION NEEDED",
        "",
        "1. Visit the Instagram post: " + url,
        "2. Copy the caption text",
        "3. Use the 'Extract from Caption' feature in the app",
        "4. Paste the caption to automatically extract ingredients and instructions",
        "",
        "💡 Tip: Look for ingredient lists and cooking steps in the caption or carousel images.",
      ],
      prepTime: 0,
      cookTime: 0,
      servings: 1,
      tags: (() => {
        // Apply enhanced filtering to remove non-food tags
        const { filterFoodTags } = require("./tagUtils");
        // Don't add any source metadata tags since they get filtered out
        // Just return empty array for fallback recipes
        return [];
      })(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return minimalRecipe;
  }
}

/**
 * Simple test function to verify Instagram extraction with the new API
 */
export async function testInstagramExtractionSimple(url: string): Promise<{
  success: boolean;
  data?: {
    caption: string;
    author: string;
    thumbnail: string | null;
  };
  error?: string;
}> {
  try {
    const response = await fetch(
      `${RECIPE_EXTRACTION_SERVICE_URL}/api/extract-enhanced`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      }
    );

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        data: {
          caption: result.data.caption,
          author:
            result.data.metadata?.og_title?.split(" on Instagram")[0] ||
            "Unknown",
          thumbnail: result.data.metadata?.og_image || null,
        },
      };
    } else {
      return {
        success: false,
        error: result.error || "Failed to extract Instagram data",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
