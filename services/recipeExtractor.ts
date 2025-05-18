import { Recipe, Ingredient } from "@/types";
import { supabase } from "@/lib/supabase";
import {
  scrapeFromUrl,
  analyzeRecipeText as deepseekAnalyzeRecipe,
  ScrapedContent,
} from "./deepseekservice";

// Get API key from environment variable
const DEEPSEEK_API_KEY =
  process.env.DEEPSEEK_API_KEY || "sk-b168886219d34d939d0b7c6f760b4123";
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

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

// API endpoint for Instagram recipe extraction
const EXTRACT_API_URL = "https://recipeextractionservice.onrender.com";

/**
 * Extract recipe from URL with proper error handling and response management
 */
export async function extractRecipeFromUrl(
  url: string
): Promise<Partial<Recipe>> {
  try {
    // Create a single extraction tracking ID for logging/debugging
    const extractionId = `extract_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    console.log(`[${extractionId}] Starting extraction for URL: ${url}`);

    // Check extraction limits (commented out for now)
    // await checkExtractionLimits();

    // Start the extraction process
    console.log(`[${extractionId}] Scraping content from URL`);
    const scrapedContent = await scrapeFromUrl(url);

    if (!scrapedContent || !scrapedContent.caption) {
      throw new Error("Failed to extract content from URL");
    }

    console.log(
      `[${extractionId}] Analyzing recipe text (${scrapedContent.caption.length} chars)`
    );
    const recipeData = await deepseekAnalyzeRecipe(scrapedContent.caption);

    if (!recipeData) {
      throw new Error("Failed to analyze recipe text");
    }

    // Create the recipe object with all available data
    const recipe: Partial<Recipe> = {
      title: recipeData.title || recipeData.name || "Untitled Recipe",
      description: recipeData.description,
      imageUrl: scrapedContent.imageUrl,
      prepTime: recipeData.prepTime || 0,
      cookTime: recipeData.cookTime || 0,
      servings: recipeData.servings || 2,
      // Add additional fields as needed
    };

    // Log success
    console.log(
      `[${extractionId}] Successfully extracted recipe: ${recipe.title}`
    );

    // For future implementation: record successful extraction in user's quota
    // await recordExtraction(extractionId);

    return recipe;
  } catch (error) {
    // Properly handle and log the error
    if (error instanceof Error) {
      console.error("Recipe extraction error:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error("Unknown recipe extraction error:", error);
    }

    throw error; // Re-throw for the caller to handle
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

    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
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

    const prompt = `You are a culinary assistant that extracts structured recipes from raw text, formats them cleanly, and enhances them with detailed categorization and tagging.

Extract a clean JSON object from the following recipe text:

---
${processedText}
---

Return the recipe in the following **strict format**, preserving the original wording wherever possible:

\`\`\`json
{
  "title": "Recipe Title",
  "description": "A short, enticing summary of the dish",
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": "amount + unit (e.g., 1 cup, 2 tbsp)"
    }
  ],
  "instructions": [
    "Step 1: Instruction here.",
    "Step 2: Instruction here."
  ],
  "servings": number,
  "prep_time": number (in minutes),
  "cook_time": number (in minutes),
  "meal_type": "breakfast" | "lunch" | "dinner" | "snack" | "dessert" | "appetizer",
  "cuisine_type": "italian" | "mexican" | "chinese" | "indian" | "french" | "japanese" | "mediterranean" | "american" | "thai" | "other",
  "difficulty_level": "easy" | "medium" | "hard",
  "nutrition": {
    "calories": number,
    "protein": "e.g. 25g",
    "carbs": "e.g. 40g",
    "fat": "e.g. 15g",
    "fiber": "e.g. 6g"
  },
  "dietary_categories": [
    "vegetarian", "vegan", "gluten_free", "dairy_free", "keto", "paleo", "low_carb", "low_fat", "high_protein", etc.
  ],
  "cooking_method": "bake" | "grill" | "fry" | "boil" | "steam" | "slow_cook" | "roast" | "no_cook",
  "occasion": "everyday" | "holiday" | "special_occasion" | "weeknight" | "weekend",
  "flavors": ["sweet", "savory", "spicy", "tangy", "bitter", "umami"],
  "main_ingredient": "chicken" | "beef" | "pork" | "fish" | "vegetables" | "pasta" | "rice",
  "nutritional_tags": [
    "high_protein", "low_carb", "vegan", "vegetarian", "gluten_free", etc.
  ]
}
\`\`\``;

    console.log("Sending recipe text to DeepSeek API");

    // Set timeout for the API request to avoid hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(
          `DeepSeek API error: ${response.status} ${response.statusText}`
        );
        const errorText = await response.text();
        console.error(`DeepSeek API error details: ${errorText}`);
        throw new Error(
          `API request failed with status ${response.status}: ${errorText}`
        );
      }

      const data = (await response.json()) as DeepseekResponse;
      console.log("Received response from DeepSeek API");

      if (!data.choices || !data.choices[0]?.message?.content) {
        console.error("Unexpected API response format:", data);
        throw new Error("Invalid response format from DeepSeek API");
      }

      const content = data.choices[0]?.message?.content || "";

      // Extract JSON from the response
      const jsonMatch =
        content.match(/```json\s*([\s\S]*?)\s*```/) ||
        content.match(/{[\s\S]*}/);

      if (!jsonMatch) {
        console.error("Failed to extract JSON from response content:", content);
        throw new Error("Failed to extract JSON from API response");
      }

      const jsonString = jsonMatch[0].replace(/```json|```/g, "").trim();
      console.log(`Extracted JSON string (${jsonString.length} chars)`);

      try {
        const parsedRecipe = JSON.parse(jsonString) as ParsedRecipe;
        console.log("Successfully parsed recipe JSON:", {
          title: parsedRecipe.title,
          ingredientsCount: parsedRecipe.ingredients?.length || 0,
          instructionsCount: parsedRecipe.instructions?.length || 0,
        });

        // Convert to our app's Recipe format
        const ingredients: Ingredient[] = (parsedRecipe.ingredients || []).map(
          (ing, index) => {
            // Try to extract unit from quantity
            const quantityParts = ing.quantity
              ? ing.quantity.split(" ")
              : ["1"];
            const quantity = quantityParts[0] || "";
            const unit = quantityParts.slice(1).join(" ") || "";

            return {
              id: `temp-${index}`,
              name: ing.name || "Unknown ingredient",
              amount: parseFloat(quantity) || 1,
              unit: unit,
            };
          }
        );

        // Combine all tag-like fields into a comprehensive tags array
        const allTags = [
          // Convert nutritional tags
          ...(parsedRecipe.nutritional_tags || []).map((tag) => formatTag(tag)),

          // Add dietary categories as tags
          ...(parsedRecipe.dietary_categories || []).map((cat) =>
            formatTag(cat)
          ),

          // Add cuisine type
          parsedRecipe.cuisine_type
            ? formatTag(parsedRecipe.cuisine_type)
            : null,

          // Add cooking method
          parsedRecipe.cooking_method
            ? formatTag(parsedRecipe.cooking_method)
            : null,

          // Add occasion
          parsedRecipe.occasion ? formatTag(parsedRecipe.occasion) : null,

          // Add difficulty level
          parsedRecipe.difficulty_level
            ? `Difficulty: ${formatTag(parsedRecipe.difficulty_level)}`
            : null,

          // Add main ingredient
          parsedRecipe.main_ingredient
            ? `Main: ${formatTag(parsedRecipe.main_ingredient)}`
            : null,

          // Add flavors
          ...(parsedRecipe.flavors || []).map(
            (flavor) => `Flavor: ${formatTag(flavor)}`
          ),
        ].filter(Boolean) as string[]; // Filter out any null values

        // Determine the most appropriate category for the recipe
        const category = determineRecipeCategory(
          parsedRecipe.meal_type,
          parsedRecipe.cuisine_type,
          parsedRecipe.main_ingredient,
          parsedRecipe.cooking_method
        );

        console.log("Recipe analysis complete");

        return {
          name: parsedRecipe.title || "Untitled Recipe",
          description: parsedRecipe.description || "",
          ingredients: ingredients,
          instructions: parsedRecipe.instructions || [],
          prepTime: parsedRecipe.prep_time || 0,
          cookTime: parsedRecipe.cook_time || 0,
          servings: parsedRecipe.servings || 2,
          tags: allTags,
        };
      } catch (error) {
        console.error("JSON parsing error:", error);
        console.error("JSON string that failed to parse:", jsonString);
        throw new Error(
          `Failed to parse recipe JSON: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("API request error:", fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error("Error analyzing recipe with DeepSeek API:", error);
    throw new Error(
      "Failed to analyze recipe. Please check your input and try again."
    );
  }
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

/**
 * Helper function to format tags with proper capitalization
 */
function formatTag(tag: string): string {
  // Handle tags with underscores (e.g., "gluten_free")
  if (tag.includes("_")) {
    return tag
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // Handle tags that are already space-separated
  return tag
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
