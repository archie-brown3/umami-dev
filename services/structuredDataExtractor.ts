/**
 * Structured Data Extraction Service
 * Handles parsing of JSON-LD, microdata, and other structured recipe data
 * Following rules.md: Services contain API calls and business logic
 */

import { Recipe, Ingredient } from "../types";
import { API_ENDPOINTS } from "../constants/api";

export interface StructuredRecipeData {
  name?: string;
  description?: string;
  recipeIngredient?: string[];
  recipeInstructions?: Array<{
    text: string;
    name?: string;
  }>;
  prepTime?: string; // ISO 8601 duration (e.g., "PT15M")
  cookTime?: string;
  totalTime?: string;
  recipeYield?: string | string[];
  image?: string | string[];
  author?: string | { name: string };
  recipeCategory?: string[];
  recipeCuisine?: string[];
  keywords?: string;
  aggregateRating?: {
    ratingValue: string;
    ratingCount: string;
  };
  nutrition?: {
    calories?: string;
    protein?: string;
    carbohydrateContent?: string;
    fatContent?: string;
  };
}

/**
 * Extract structured recipe data from a URL
 * Priority: JSON-LD > Microdata > Plain text analysis
 */
export async function extractStructuredRecipeData(url: string): Promise<{
  structuredData: StructuredRecipeData | null;
  fallbackText: string;
}> {
  try {
    console.log(`[StructuredDataExtractor] Starting extraction for: ${url}`);

    // First, try to get structured data from the web scraper
    const scrapedData = await scrapeWebsiteData(url);

    // Check for JSON-LD structured data
    const jsonLdData = await extractJsonLdData(url);
    if (jsonLdData) {
      console.log(`[StructuredDataExtractor] Found JSON-LD structured data`);
      return {
        structuredData: jsonLdData,
        fallbackText: scrapedData.text || "",
      };
    }

    // Check scraped data for structured elements
    const structuredFromScrape = extractStructuredFromScrapedData(scrapedData);
    if (structuredFromScrape) {
      console.log(
        `[StructuredDataExtractor] Found structured data in scraped content`
      );
      return {
        structuredData: structuredFromScrape,
        fallbackText: scrapedData.text || "",
      };
    }

    // No structured data found, return text for AI analysis
    console.log(
      `[StructuredDataExtractor] No structured data found, falling back to text analysis`
    );
    return {
      structuredData: null,
      fallbackText: scrapedData.text || "",
    };
  } catch (error) {
    console.error(`[StructuredDataExtractor] Error extracting data:`, error);
    throw error;
  }
}

/**
 * Extract JSON-LD structured data directly from the webpage
 */
async function extractJsonLdData(
  url: string
): Promise<StructuredRecipeData | null> {
  try {
    // Use a simple fetch to get the HTML and parse JSON-LD
    const response = await fetch(url);
    const html = await response.text();

    // Extract JSON-LD script tags
    const jsonLdMatches = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis
    );

    if (!jsonLdMatches) {
      return null;
    }

    for (const match of jsonLdMatches) {
      try {
        // Extract JSON content from script tag
        const jsonContent = match
          .replace(/<script[^>]*>/i, "")
          .replace(/<\/script>/i, "");
        const data = JSON.parse(jsonContent);

        // Handle different JSON-LD structures
        let recipeData = null;

        if (data["@type"] === "Recipe") {
          recipeData = data;
        } else if (data["@graph"]) {
          // Look for Recipe in @graph array
          recipeData = data["@graph"].find(
            (item: any) => item["@type"] === "Recipe"
          );
        } else if (Array.isArray(data)) {
          // Look for Recipe in array
          recipeData = data.find((item: any) => item["@type"] === "Recipe");
        }

        if (recipeData) {
          console.log(
            `[StructuredDataExtractor] Successfully parsed JSON-LD recipe data`
          );
          return recipeData as StructuredRecipeData;
        }
      } catch (parseError) {
        console.warn(
          `[StructuredDataExtractor] Failed to parse JSON-LD:`,
          parseError
        );
        continue;
      }
    }

    return null;
  } catch (error) {
    console.warn(`[StructuredDataExtractor] Error fetching JSON-LD:`, error);
    return null;
  }
}

/**
 * Scrape website data using the existing web scraper API
 */
async function scrapeWebsiteData(
  url: string
): Promise<{ text: string; metadata: any; images: any }> {
  const extractionServiceUrl = API_ENDPOINTS.RECIPE_EXTRACTION_SERVICE_URL;

  if (!extractionServiceUrl) {
    throw new Error("Recipe extraction service URL not configured");
  }

  const response = await fetch(`${extractionServiceUrl}/api/scrape-web`, {
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
        links: true,
        tables: false,
        forms: false,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Web scraping failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.text?.full_text || "",
    metadata: data.metadata || {},
    images: data.images || {},
  };
}

/**
 * Extract structured data from scraped content (fallback method)
 */
function extractStructuredFromScrapedData(
  scrapedData: any
): StructuredRecipeData | null {
  // This would implement parsing of microdata, RDFa, or other structured formats
  // For now, return null to fall back to AI analysis
  return null;
}

/**
 * Transform structured data to Recipe format
 */
export function transformStructuredDataToRecipe(
  structuredData: StructuredRecipeData,
  sourceUrl: string,
  imageUrl?: string
): Partial<Recipe> {
  console.log(
    `[StructuredDataExtractor] Transforming structured data to Recipe format`
  );

  // Parse ISO 8601 duration strings (e.g., "PT15M" = 15 minutes)
  const parseDuration = (duration?: string): number => {
    if (!duration) return 0;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    return hours * 60 + minutes;
  };

  // Parse servings from various formats
  const parseServings = (recipeYield?: string | string[]): number => {
    if (!recipeYield) return 4;
    const yieldStr = Array.isArray(recipeYield) ? recipeYield[0] : recipeYield;
    const match = yieldStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 4;
  };

  // Transform ingredients with proper parsing
  const ingredients: Ingredient[] = (structuredData.recipeIngredient || []).map(
    (ing, index) => {
      const { amount, unit, name } = parseIngredientText(ing);
      return {
        id: `structured-${index}`,
        name: name.trim(),
        amount,
        unit: unit.trim(),
      };
    }
  );

  // Transform instructions
  const instructions: string[] = (structuredData.recipeInstructions || []).map(
    (instruction) => instruction.text || instruction.toString()
  );

  // Extract image URL
  let finalImageUrl = imageUrl;
  if (!finalImageUrl && structuredData.image) {
    const imageData = Array.isArray(structuredData.image)
      ? structuredData.image[0]
      : structuredData.image;
    finalImageUrl =
      typeof imageData === "string" ? imageData : (imageData as any)?.url;
  }

  // Extract author
  let author: string | undefined;
  if (structuredData.author) {
    author =
      typeof structuredData.author === "string"
        ? structuredData.author
        : structuredData.author.name;
  }

  const recipe: Partial<Recipe> = {
    title: structuredData.name || "Untitled Recipe",
    description: structuredData.description || "",
    ingredients,
    instructions,
    prepTime: parseDuration(structuredData.prepTime),
    cookTime: parseDuration(structuredData.cookTime),
    servings: parseServings(structuredData.recipeYield),
    imageUrl: finalImageUrl,
    sourceUrl,
    author,
    tags: [], // Will be populated from categories/keywords if available
  };

  // Add tags from categories and keywords
  const tags: string[] = [];
  if (structuredData.recipeCategory) {
    tags.push(...structuredData.recipeCategory);
  }
  if (structuredData.recipeCuisine) {
    tags.push(...structuredData.recipeCuisine);
  }
  if (structuredData.keywords) {
    const keywordTags = structuredData.keywords.split(",").map((k) => k.trim());
    tags.push(...keywordTags);
  }
  recipe.tags = tags.filter(Boolean);

  console.log(
    `[StructuredDataExtractor] Transformed recipe: ${ingredients.length} ingredients, ${instructions.length} instructions`
  );

  return recipe;
}

/**
 * Parse ingredient text to extract amount, unit, and name
 * Enhanced version with better pattern matching
 */
function parseIngredientText(ingredientText: string): {
  amount: number;
  unit: string;
  name: string;
} {
  // Enhanced regex patterns for ingredient parsing
  const patterns = [
    // Pattern 1: "2 cups flour" or "1/2 cup sugar"
    /^([\d\/.]+(?:\s*-\s*[\d\/.]+)?)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(.+)$/,
    // Pattern 2: "2 tablespoons olive oil"
    /^([\d\/.]+(?:\s*-\s*[\d\/.]+)?)\s+(tablespoons?|teaspoons?|tbsp|tsp|cups?|ounces?|oz|pounds?|lbs?|grams?|g|kilograms?|kg|cloves?|slices?|pieces?)\s+(.+)$/i,
    // Pattern 3: "~2 cups flour" (with tilde)
    /^~?([\d\/.]+(?:\s*-\s*[\d\/.]+)?)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(.+)$/,
    // Pattern 4: Just number and ingredient "2 eggs"
    /^([\d\/.]+(?:\s*-\s*[\d\/.]+)?)\s+(.+)$/,
  ];

  // Try each pattern
  for (const pattern of patterns) {
    const match = ingredientText.match(pattern);
    if (match) {
      const [, quantity, unitOrName, nameOrEmpty] = match;

      // If we have 4 groups (quantity, unit, name), it's a full match
      if (nameOrEmpty) {
        return {
          amount: parseFloat(quantity.replace(/~/g, "")) || 1,
          unit: unitOrName.trim(),
          name: nameOrEmpty.trim(),
        };
      }

      // If we only have quantity and name (no unit)
      return {
        amount: parseFloat(quantity.replace(/~/g, "")) || 1,
        unit: "",
        name: unitOrName.trim(),
      };
    }
  }

  // Fallback: if no pattern matches, treat as just a name
  return {
    amount: 1,
    unit: "",
    name: ingredientText.trim(),
  };
}
