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
  // Clean the input text
  const cleanText = ingredientText.trim();

  // Enhanced regex patterns to handle various ingredient formats
  const patterns = [
    // Pattern 1: "2 cups flour" or "1/2 cup sugar" - quantity + unit + ingredient
    /^([\d\/.]+(?:\s*-\s*[\d\/.]+)?)\s+(cups?|tbsps?|tsps?|tablespoons?|teaspoons?|ounces?|ozs?|pounds?|lbs?|grams?|gs?|kilograms?|kgs?|milliliters?|mls?|liters?|ls?|pints?|quarts?|gallons?|cloves?|slices?|pieces?|pinches?|dashes?|handfuls?|bunches?|packages?|cans?|bottles?|jars?)\s+(.+)$/i,

    // Pattern 2: "2 large eggs" or "3 medium onions" - quantity + size + ingredient
    /^([\d\/.]+(?:\s*-\s*[\d\/.]+)?)\s+(small|medium|large|extra\s+large|jumbo)\s+(.+)$/i,

    // Pattern 3: "~2 cups flour" (with tilde or approximation)
    /^[~≈]?([\d\/.]+(?:\s*-\s*[\d\/.]+)?)\s+(cups?|tbsps?|tsps?|tablespoons?|teaspoons?|ounces?|ozs?|pounds?|lbs?|grams?|gs?|kilograms?|kgs?|milliliters?|mls?|liters?|ls?|pints?|quarts?|gallons?|cloves?|slices?|pieces?|pinches?|dashes?|handfuls?|bunches?|packages?|cans?|bottles?|jars?)\s+(.+)$/i,

    // Pattern 4: Just number and ingredient "2 eggs" or "3 carrots"
    /^([\d\/.]+(?:\s*-\s*[\d\/.]+)?)\s+(.+)$/,
  ];

  // Try each pattern in order of specificity
  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const [, quantity, unitOrSize, nameOrEmpty] = match;

      // If we have a third group (name), it means we matched quantity + unit/size + name
      if (nameOrEmpty) {
        // Check if the second group is a valid unit or size descriptor
        const commonUnits = [
          "cup",
          "cups",
          "tbsp",
          "tbsps",
          "tsp",
          "tsps",
          "tablespoon",
          "tablespoons",
          "teaspoon",
          "teaspoons",
          "oz",
          "ozs",
          "ounce",
          "ounces",
          "g",
          "gs",
          "gram",
          "grams",
          "kg",
          "kgs",
          "kilogram",
          "kilograms",
          "lb",
          "lbs",
          "pound",
          "pounds",
          "ml",
          "mls",
          "milliliter",
          "milliliters",
          "l",
          "ls",
          "liter",
          "liters",
          "pint",
          "pints",
          "quart",
          "quarts",
          "gallon",
          "gallons",
          "clove",
          "cloves",
          "slice",
          "slices",
          "piece",
          "pieces",
          "pinch",
          "pinches",
          "dash",
          "dashes",
          "handful",
          "handfuls",
          "bunch",
          "bunches",
          "package",
          "packages",
          "can",
          "cans",
          "bottle",
          "bottles",
          "jar",
          "jars",
        ];

        const sizeDescriptors = [
          "small",
          "medium",
          "large",
          "extra large",
          "jumbo",
        ];

        const isUnit = commonUnits.some(
          (unit) =>
            unitOrSize.toLowerCase().replace(/s$/, "") ===
            unit.toLowerCase().replace(/s$/, "")
        );

        const isSize = sizeDescriptors.some(
          (size) => unitOrSize.toLowerCase() === size.toLowerCase()
        );

        if (isUnit) {
          return {
            amount: parseFloat(quantity.replace(/[~≈]/g, "")) || 1,
            unit: unitOrSize.trim(),
            name: nameOrEmpty.trim(),
          };
        } else if (isSize) {
          return {
            amount: parseFloat(quantity.replace(/[~≈]/g, "")) || 1,
            unit: "",
            name: `${unitOrSize} ${nameOrEmpty}`.trim(),
          };
        }
      }

      // If we only have quantity and name (no unit), or the unit wasn't recognized
      const ingredientName = nameOrEmpty || unitOrSize;

      // Special handling: if the "quantity" looks like it might be part of the ingredient name
      // (e.g., "1 large onion" where "1" is the actual quantity but "large" is part of the name)
      const parsedQuantity = parseFloat(quantity.replace(/[~≈]/g, ""));

      return {
        amount: parsedQuantity || 1,
        unit: "",
        name: ingredientName.trim(),
      };
    }
  }

  // Advanced fallback: check if the text contains embedded quantities that should be preserved
  // Example: "chicken breast (2 pieces)" should not extract "2" as the main quantity
  const embeddedQuantityPattern = /^(.+?)\s*\(.*?\d+.*?\)(.*)$/;
  const embeddedMatch = cleanText.match(embeddedQuantityPattern);

  if (embeddedMatch) {
    return {
      amount: 1,
      unit: "",
      name: cleanText, // Keep the full text including the embedded quantity
    };
  }

  // Final fallback: if no pattern matches, treat as just a name with quantity 1
  return {
    amount: 1,
    unit: "",
    name: cleanText,
  };
}
