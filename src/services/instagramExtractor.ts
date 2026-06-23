import { Recipe, Ingredient } from "../types";

const API_BASE_URL = "https://recipeextractionservice.onrender.com";

interface InstagramApiResponse {
  shortcode: string;
  caption: string;
  username: string;
  media: Array<{
    url: string;
    type: string;
  }>;
  likes?: number;
  timestamp?: string;
  url: string;
}

/**
 * Simple, reliable Instagram recipe extraction using the dedicated API endpoint
 * This uses the working /api/extract endpoint specifically designed for Instagram
 */
export async function extractInstagramRecipe(
  instagramUrl: string
): Promise<Recipe> {
  console.log(`[InstagramExtractor] Starting extraction for: ${instagramUrl}`);

  try {
    // Validate Instagram URL
    if (!instagramUrl.includes("instagram.com")) {
      throw new Error("Invalid Instagram URL");
    }

    console.log(
      `[InstagramExtractor] Making API request to: ${API_BASE_URL}/api/scrape-web`
    );

    // Use the more reliable generic web scraper for Instagram
    const response = await fetch(`${API_BASE_URL}/api/scrape-web`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: instagramUrl,
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
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const scrapedData = await response.json();
    console.log(`[InstagramExtractor] Web scraping successful`);

    // Extract Instagram data from the generic scraper response
    const caption =
      scrapedData.metadata?.open_graph?.description ||
      scrapedData.metadata?.description ||
      scrapedData.text?.full_text ||
      "No caption extracted";

    const username = extractUsernameFromUrl(instagramUrl, scrapedData);
    const imageUrl =
      scrapedData.metadata?.open_graph?.image ||
      scrapedData.images?.images?.[0]?.url ||
      null;

    console.log(`[InstagramExtractor] Extracted data:`, {
      username,
      captionLength: caption?.length || 0,
      hasImage: !!imageUrl,
    });

    // Validate we have essential data
    if (!caption || caption.length < 50) {
      throw new Error(
        "Instagram post caption is too short or empty - extraction may have failed"
      );
    }

    // Create data object in the format expected by the rest of the function
    const data = {
      caption,
      username,
      media: imageUrl ? [{ url: imageUrl, type: "image" }] : [],
      url: instagramUrl,
    };

    // Parse ingredients and instructions from caption using simple text processing
    const recipeData = parseInstagramCaption(data.caption);

    // Create Recipe object directly from API response
    const recipe: Recipe = {
      id: generateRecipeId(),
      title: recipeData.title || `Recipe from @${data.username}`,
      name: recipeData.title || `Recipe from @${data.username}`,
      description:
        recipeData.description || data.caption.substring(0, 200) + "...",
      ingredients:
        recipeData.ingredients.length > 0
          ? recipeData.ingredients
          : [
              {
                id: "instagram-1",
                name: "See Instagram post for full ingredients list",
                amount: 1,
                unit: "item",
              },
            ],
      instructions:
        recipeData.instructions.length > 0
          ? recipeData.instructions
          : ["Full recipe instructions from Instagram:", data.caption],
      prepTime: recipeData.prepTime || 0,
      cookTime: recipeData.cookTime || 0,
      servings: recipeData.servings || 4,
      imageUrl:
        data.media && data.media.length > 0 ? data.media[0].url : undefined,
      tags: ["Instagram", "Social Media Recipe"],
      sourceUrl: data.url || instagramUrl,
      author: data.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log(`[InstagramExtractor] Recipe created successfully:`, {
      title: recipe.title,
      ingredientCount: recipe.ingredients.length,
      instructionCount: recipe.instructions.length,
      hasImage: !!recipe.imageUrl,
    });

    return recipe;
  } catch (error) {
    console.error(`[InstagramExtractor] Extraction failed:`, error);

    // Provide clear error messages
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (
      errorMessage.includes("Network request failed") ||
      errorMessage.includes("fetch")
    ) {
      throw new Error(
        "Network error: Unable to connect to Instagram extraction service. Check your internet connection."
      );
    } else if (errorMessage.includes("404")) {
      throw new Error(
        "Instagram post not found. Make sure the URL is correct and the post is public."
      );
    } else if (errorMessage.includes("403") || errorMessage.includes("401")) {
      throw new Error(
        "Access denied: Instagram is blocking this request. Try again later."
      );
    } else {
      throw new Error(`Instagram extraction failed: ${errorMessage}`);
    }
  }
}

/**
 * Simple caption parsing to extract recipe structure
 */
function parseInstagramCaption(caption: string): {
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
} {
  const lines = caption
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Try to find a title (usually first line or line with recipe name)
  let title = "";
  const firstLine = lines[0];
  if (
    firstLine &&
    firstLine.length < 100 &&
    !firstLine.includes("Ingredients")
  ) {
    title = firstLine.replace(/[🔥🌿🐓✨🍽️💯]/g, "").trim();
  }
  if (!title) {
    title = "Instagram Recipe";
  }

  // Simple ingredient extraction (look for lines that start with numbers, bullets, or dashes)
  const ingredients: Ingredient[] = [];
  let ingredientId = 1;

  for (const line of lines) {
    if (
      line.match(/^[\d•\-\*]\s*/) ||
      line.toLowerCase().includes("cup") ||
      line.toLowerCase().includes("tbsp")
    ) {
      ingredients.push({
        id: `instagram-ing-${ingredientId++}`,
        name: line.replace(/^[\d•\-\*]\s*/, "").trim(),
        amount: 1,
        unit: "item",
      });
    }
  }

  // Simple instruction extraction (numbered steps or remaining text)
  const instructions: string[] = [];
  let foundInstructions = false;

  for (const line of lines) {
    if (
      line.toLowerCase().includes("instructions") ||
      line.toLowerCase().includes("method") ||
      line.match(/^\d+\./)
    ) {
      foundInstructions = true;
      if (
        !line.toLowerCase().includes("instructions") &&
        !line.toLowerCase().includes("method")
      ) {
        instructions.push(line);
      }
    } else if (foundInstructions && line.length > 10) {
      instructions.push(line);
    }
  }

  // Extract timing info if present
  let prepTime = 0;
  let cookTime = 0;
  let servings = 4;

  const timingMatch = caption.match(/(\d+)\s*(min|minutes|hour|hours)/gi);
  if (timingMatch && timingMatch.length > 0) {
    const firstTime = parseInt(timingMatch[0]);
    if (firstTime) prepTime = firstTime;
  }

  const servingsMatch = caption.match(/(\d+)\s*(servings?|serves?|portions?)/i);
  if (servingsMatch) {
    servings = parseInt(servingsMatch[1]) || 4;
  }

  return {
    title,
    description:
      caption.substring(0, 300) + (caption.length > 300 ? "..." : ""),
    ingredients,
    instructions: instructions.length > 0 ? instructions : [caption],
    prepTime,
    cookTime,
    servings,
  };
}

/**
 * Extract username from Instagram URL and scraped data
 */
function extractUsernameFromUrl(url: string, scrapedData: any): string {
  // Try to extract from URL first
  const urlMatch = url.match(/instagram\.com\/([^\/\?]+)/i);
  if (
    urlMatch &&
    urlMatch[1] !== "share" &&
    urlMatch[1] !== "p" &&
    urlMatch[1] !== "reel"
  ) {
    return urlMatch[1];
  }

  // Try to extract from Open Graph title
  const ogTitle = scrapedData.metadata?.open_graph?.title;
  if (ogTitle) {
    const match = ogTitle.match(/(\w+) on Instagram/i);
    if (match) return match[1];
  }

  return "unknown";
}

/**
 * Generate a unique recipe ID
 */
function generateRecipeId(): string {
  return `recipe_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Test the Instagram extraction with a specific URL
 */
export async function testInstagramExtraction(url: string): Promise<{
  success: boolean;
  recipe?: Recipe;
  error?: string;
}> {
  try {
    const recipe = await extractInstagramRecipe(url);
    return {
      success: true,
      recipe,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
