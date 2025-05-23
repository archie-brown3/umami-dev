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

// Get the API URL from environment variables
const RECIPE_EXTRACTION_SERVICE_URL =
  process.env.EXPO_PUBLIC_RECIPE_EXTRACTION_SERVICE_URL;

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

    // Use the extraction API
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
        `API Error: ${extractApiResponse.status} ${extractApiResponse.statusText}`
      );
    }

    // Get the response as text first for better debugging
    const responseText = await extractApiResponse.text();

    try {
      const recipeData = JSON.parse(responseText);
      addServiceLog(`Successfully parsed extraction API response`);

      // Store the original text for potential reanalysis if needed
      const originalText = recipeData.caption || "";

      // Analyze the recipe text to extract structured data
      const analysisResult = await analyzeRecipeText(originalText);

      // Return the combined data
      return {
        ...analysisResult,
        imageUrl: recipeData.media?.[0]?.url,
        originalText,
      };
    } catch (parseError) {
      console.error(`JSON parse error:`, parseError);
      throw new Error(
        `Failed to parse API response: ${
          parseError instanceof Error ? parseError.message : "Unknown error"
        }`
      );
    }
  } catch (error) {
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

// Generic recipe website scraper
async function scrapeGenericRecipeWebsite(
  url: string
): Promise<ScrapedContent | null> {
  try {
    // Since we can't directly scrape from the frontend due to CORS restrictions,
    // we'll use DeepSeek API to simulate extraction
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
