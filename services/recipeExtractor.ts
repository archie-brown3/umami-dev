import { Recipe, Ingredient } from "../types";
import { supabase } from "@/lib/supabase";
import { API_ENDPOINTS } from "@/constants/api";
import {
  scrapeFromUrl,
  analyzeRecipeText,
  ScrapedContent,
  addServiceLog,
} from "./deepseekservice";
import { formatTag } from "./utils";

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
 * Extract recipe data from a URL
 */
export async function extractRecipeFromUrl(
  url: string
): Promise<Partial<Recipe>> {
  try {
    addServiceLog(`Starting extraction for URL: ${url}`);

    // Check if it's an Instagram URL
    const domain = new URL(url).hostname.toLowerCase();

    if (domain.includes("instagram.com")) {
      addServiceLog("Using Instagram scrape-web API");

      // COMMENTED OUT - Old extraction API approach
      /*
      // Use the extraction API for Instagram
      const extractApiResponse = await fetch(
        `${RECIPE_EXTRACTION_SERVICE_URL}/api/extract`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        }
      );

      if (!extractApiResponse.ok) {
        throw new Error(
          `Instagram API Error: ${extractApiResponse.status} ${extractApiResponse.statusText}`
        );
      }

      const responseText = await extractApiResponse.text();
      const recipeData = JSON.parse(responseText);
      addServiceLog(`Successfully parsed Instagram extraction API response`);

      // Store the original text for analysis
      const originalText = recipeData.caption || "";

      // Analyze the recipe text to extract structured data
      const analysisResult = await analyzeRecipeText(originalText);

      // Return the combined data
      return {
        ...analysisResult,
        imageUrl: recipeData.media?.[0]?.url,
        originalText,
      };
      */

      // NEW: Use the scrape-web API for Instagram
      const webScrapingResponse = await fetch(
        `${RECIPE_EXTRACTION_SERVICE_URL}/api/scrape-web`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
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

      if (!webScrapingResponse.ok) {
        throw new Error(
          `Instagram Scrape API Error: ${webScrapingResponse.status} ${webScrapingResponse.statusText}`
        );
      }

      const scrapedData = await webScrapingResponse.json();
      addServiceLog(`Successfully scraped Instagram post data`);

      // Log the scraped data structure for testing
      addServiceLog(`Instagram scrape data: {
        "text_length": ${scrapedData.text?.full_text?.length || 0},
        "word_count": ${scrapedData.text?.word_count || 0},
        "images_count": ${scrapedData.images?.total_images || 0},
        "metadata_title": "${scrapedData.metadata?.title || "none"}",
        "has_open_graph": ${!!scrapedData.metadata?.open_graph}
      }`);

      // Extract Instagram-specific data using enhanced methods
      const caption =
        scrapedData.metadata?.open_graph?.description ||
        scrapedData.metadata?.description ||
        scrapedData.text?.full_text ||
        "No caption extracted";

      // Use enhanced username extraction from metadata (same logic as DeepSeek service)
      let username = "unknown";

      // Method 1: From twitter:title: "Cal Reynolds (@username) • Instagram reel"
      const twitterTitle = scrapedData.metadata?.twitter_card?.title;
      if (twitterTitle) {
        const match = twitterTitle.match(/\(@([^)]+)\)/);
        if (match) {
          username = match[1];
          addServiceLog(`Username extracted from twitter:title: ${username}`);
        }
      }

      // Method 2: From og:description: "username on Date:"
      if (username === "unknown") {
        const ogDesc = scrapedData.metadata?.open_graph?.description;
        if (ogDesc) {
          const match = ogDesc.match(/(\w+) on \w+ \d+, \d+:/);
          if (match) {
            username = match[1];
            addServiceLog(
              `Username extracted from og:description: ${username}`
            );
          }
        }
      }

      // Method 3: From URL pattern (fallback)
      if (username === "unknown") {
        const urlMatch = url.match(/instagram\.com\/([^\/\?]+)/i);
        if (
          urlMatch &&
          urlMatch[1] !== "share" &&
          urlMatch[1] !== "p" &&
          urlMatch[1] !== "reel"
        ) {
          username = urlMatch[1];
          addServiceLog(`Username extracted from URL: ${username}`);
        }
      }

      // Use enhanced image processing for Instagram CDN URLs
      let thumbnail = scrapedData.images?.images?.[0]?.url || null;

      // Prefer metadata images for Instagram
      const ogImage = scrapedData.metadata?.open_graph?.image;
      const twitterImage = scrapedData.metadata?.twitter_card?.image;

      if (ogImage) {
        thumbnail = ogImage;
        addServiceLog(`Using og:image for Instagram: ${thumbnail}`);
      } else if (twitterImage) {
        thumbnail = twitterImage;
        addServiceLog(`Using twitter:image for Instagram: ${thumbnail}`);
      }

      // Process Instagram CDN URLs with proxy service
      if (
        thumbnail &&
        (thumbnail.includes("cdninstagram.com") ||
          thumbnail.includes("fbcdn.net"))
      ) {
        try {
          const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(
            thumbnail
          )}&w=640&h=640&fit=cover&output=jpg`;
          thumbnail = proxyUrl;
          addServiceLog(`Generated proxy URL for Instagram image: ${proxyUrl}`);
        } catch (error) {
          addServiceLog(
            `Failed to generate proxy URL, using original: ${error}`
          );
        }
      }

      addServiceLog(
        `Extracted from Instagram: caption_length=${
          caption.length
        }, username=${username}, has_thumbnail=${!!thumbnail}`
      );

      // Store the caption as original text for analysis
      const originalText = caption;

      // Analyze the caption text to extract structured recipe data
      const analysisResult = await analyzeRecipeText(originalText);

      // Return the combined data
      return {
        ...analysisResult,
        imageUrl: thumbnail,
        originalText,
        author: username,
        sourceUrl: url,
      };
    } else {
      addServiceLog("Using web scraping API for non-Instagram URL");

      // First, check if the API is available
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const healthCheck = await fetch(
          `${RECIPE_EXTRACTION_SERVICE_URL}/health`,
          {
            method: "GET",
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!healthCheck.ok) {
          throw new Error(
            `Web scraping service is unavailable (status: ${healthCheck.status})`
          );
        }

        addServiceLog("Web scraping API health check passed");
      } catch (healthError) {
        addServiceLog(
          `Web scraping API health check failed: ${
            healthError instanceof Error
              ? healthError.message
              : String(healthError)
          }`
        );
        throw new Error(
          "Web scraping service is currently unavailable. Please try again later."
        );
      }

      // Use the new web scraping API for non-Instagram URLs
      const webScrapingResponse = await fetch(
        `${RECIPE_EXTRACTION_SERVICE_URL}/api/scrape-web`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
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

      if (!webScrapingResponse.ok) {
        addServiceLog(
          `Web scraping API error: ${webScrapingResponse.status} ${webScrapingResponse.statusText}`
        );
        throw new Error(
          `Web Scraping API Error: ${webScrapingResponse.status} ${webScrapingResponse.statusText}`
        );
      }

      const scrapedData = await webScrapingResponse.json();
      addServiceLog(
        `Web scraping successful, extracted ${
          scrapedData.text?.word_count || 0
        } words`
      );

      // Log the scraping response structure for debugging
      addServiceLog(`Scraping response structure: {
        "text": {
          "word_count": ${scrapedData.text?.word_count || 0},
          "full_text_length": ${scrapedData.text?.full_text?.length || 0}
        },
        "metadata": ${scrapedData.metadata ? "present" : "missing"},
        "images": ${scrapedData.images ? "present" : "missing"}
      }`);

      // Extract the full text content from the scraped data
      const scrapedText = scrapedData.text?.full_text || "";

      if (!scrapedText) {
        addServiceLog("No text content found on the webpage");
        addServiceLog(
          `Full scraping response: ${JSON.stringify(scrapedData, null, 2)}`
        );
        throw new Error(
          "No text content found on the webpage. The page might be protected, require JavaScript, or contain only images/videos."
        );
      }

      addServiceLog(
        `Analyzing scraped content with DeepSeek (${scrapedText.length} characters)`
      );

      // Use DeepSeek to analyze and structure the scraped content into a recipe
      const analysisResult = await analyzeRecipeText(scrapedText);

      // Validate the extracted recipe
      const validationErrors = validateRecipe(analysisResult);
      if (validationErrors.length > 0) {
        addServiceLog(
          `Recipe validation failed: ${validationErrors.join(", ")}`
        );

        // Log detailed validation info for debugging
        addServiceLog(`Recipe data summary: {
          "title": "${analysisResult.title || "missing"}",
          "ingredientsCount": ${analysisResult.ingredients?.length || 0},
          "instructionsCount": ${analysisResult.instructions?.length || 0}
        }`);

        throw new Error(
          `Recipe validation failed: ${validationErrors.join(", ")}`
        );
      }

      addServiceLog(`Recipe validation passed successfully`);

      // Normalize the recipe data
      const normalizedRecipe = normalizeRecipe(analysisResult);

      // Return the combined data with metadata from scraping
      return {
        ...normalizedRecipe,
        imageUrl: scrapedData.images?.images?.[0]?.url,
        originalText: scrapedText,
        author:
          scrapedData.metadata?.author ||
          scrapedData.metadata?.open_graph?.author ||
          scrapedData.metadata?.twitter?.creator,
        sourceUrl: url,
      };
    }
  } catch (error) {
    addServiceLog(
      `Recipe extraction error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    console.error("Recipe extraction error:", error);
    throw error;
  }
}

/**
 * Extract recipe from Instagram post
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
    console.log(
      `[${extractionId}] Starting Instagram extraction for @${username}, post ID: ${postId}`
    );

    // Check extraction limits (commented out for now)
    // await checkExtractionLimits();

    // Build the Instagram post URL
    const url = `https://www.instagram.com/p/${postId}/`;

    // Use the same extraction flow as regular URLs
    return await extractRecipeFromUrl(url);
  } catch (error) {
    console.error(
      "Instagram extraction error:",
      error instanceof Error ? error.message : error
    );
    throw error;
  }
}

/**
 * For future implementation: Check if user has extraction quota available
 */
/* 
async function checkExtractionLimits(): Promise<void> {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');
    
    // Fetch the user's subscription details
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) throw error;
    
    // Check if user has a valid subscription
    if (!subscription) {
      // Free tier: Check extraction count
      const { count, error: countError } = await supabase
        .from('recipe_extractions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days
      
      if (countError) throw countError;
      
      // Free tier limit: 5 extractions per month
      if (count >= 5) {
        throw new Error('Monthly extraction limit reached. Please upgrade your subscription.');
      }
    } else {
      // Paid tier: Check if within limits
      if (subscription.extractions_remaining !== null && subscription.extractions_remaining <= 0) {
        throw new Error('Extraction limit reached on your current plan.');
      }
      
      // Check subscription validity
      if (subscription.valid_until && new Date(subscription.valid_until) < new Date()) {
        throw new Error('Your subscription has expired.');
      }
    }
  } catch (error) {
    console.error('Failed to check extraction limits:', error);
    throw error;
  }
}
*/

/**
 * For future implementation: Record a successful extraction
 */
/*
async function recordExtraction(extractionId: string): Promise<void> {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Don't record if not authenticated
    
    // Record the extraction
    const { error } = await supabase
      .from('recipe_extractions')
      .insert({
        id: extractionId,
        user_id: user.id,
        extraction_type: 'url',
        created_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    // Update subscription if needed
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, extractions_remaining')
      .eq('user_id', user.id)
      .single();
    
    if (subscription && subscription.extractions_remaining !== null) {
      await supabase
        .from('subscriptions')
        .update({ extractions_remaining: subscription.extractions_remaining - 1 })
        .eq('id', subscription.id);
    }
  } catch (error) {
    // Just log the error but don't fail the extraction
    console.error('Failed to record extraction:', error);
  }
}
*/

/**
 * Validate that a recipe has the minimal required fields
 */
export function validateRecipe(recipe: Partial<Recipe>): string[] {
  const errors: string[] = [];

  // Check required fields
  if (!recipe.title) {
    errors.push("Recipe must have a title");
  }

  // For ingredients, check if we have an array and it's not empty
  if (
    !recipe.ingredients ||
    !Array.isArray(recipe.ingredients) ||
    recipe.ingredients.length === 0
  ) {
    errors.push("Recipe must have at least one ingredient");
  }

  // For instructions, check if we have an array and it's not empty
  if (
    !recipe.instructions ||
    !Array.isArray(recipe.instructions) ||
    recipe.instructions.length === 0
  ) {
    errors.push("Recipe must have at least one instruction");
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
 * NEW: Test Instagram scraping with /scrape-web endpoint
 * This function helps analyze what data we can extract from Instagram posts
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
    addServiceLog(`Starting Instagram scraping test for: ${url}`);

    // Validate it's an Instagram URL
    if (!url.includes("instagram.com")) {
      return {
        success: false,
        message: "URL is not an Instagram URL",
      };
    }

    // Test the scrape-web endpoint
    const webScrapingResponse = await fetch(
      `${RECIPE_EXTRACTION_SERVICE_URL}/api/scrape-web`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          options: {
            text: true,
            metadata: true,
            images: true,
            headings: true,
            links: true, // Include links for testing
            tables: false,
            forms: false,
          },
        }),
      }
    );

    if (!webScrapingResponse.ok) {
      return {
        success: false,
        message: `Scrape API Error: ${webScrapingResponse.status} ${webScrapingResponse.statusText}`,
      };
    }

    const scrapedData = await webScrapingResponse.json();

    // Extract the key data we're interested in
    const caption =
      scrapedData.metadata?.open_graph?.description ||
      scrapedData.metadata?.description ||
      scrapedData.text?.full_text
        ?.split("\n")
        .slice(0, 5)
        .join(" ")
        .substring(0, 1000) ||
      "No caption extracted";

    const username = url.match(/instagram\.com\/([^\/\?]+)/i)?.[1] || "unknown";
    const thumbnail = scrapedData.images?.images?.[0]?.url || null;

    const extractedData = {
      caption,
      username,
      thumbnail,
    };

    addServiceLog(`Instagram test completed: {
      "caption_length": ${caption.length},
      "username": "${username}",
      "has_thumbnail": ${!!thumbnail},
      "total_images": ${scrapedData.images?.total_images || 0},
      "text_word_count": ${scrapedData.text?.word_count || 0}
    }`);

    return {
      success: true,
      message: "Instagram scraping test successful",
      scrapedData,
      extractedData,
      rawResponse: scrapedData,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addServiceLog(`Instagram scraping test failed: ${errorMessage}`);

    return {
      success: false,
      message: `Instagram scraping test failed: ${errorMessage}`,
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
