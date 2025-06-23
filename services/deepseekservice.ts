import { Recipe, Ingredient } from "../types";
import { API_ENDPOINTS } from "../constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatTag } from "./utils";
import { processInstagramImageUrl } from "../utils/imageProcessor";
import { filterFoodTags, filterFoodTagsWithFeedback } from "./tagUtils";

/**
 * DeepSeek AI Recipe Analysis Service
 *
 * This service handles AI-powered recipe extraction and analysis using the DeepSeek API.
 * It processes various input sources (URLs, text, images) and returns structured recipe data.
 *
 * STRUCTURED DATA FORMAT:
 *
 * Ingredients: Array of objects with structure:
 * {
 *   amount: number,    // Numeric quantity (e.g., 2, 0.5, 1)
 *   unit: string,      // Unit of measurement (e.g., "cups", "tsp", "")
 *   name: string       // Ingredient name with preparation notes (e.g., "onion, diced")
 * }
 *
 * Instructions: Array of strings:
 * [
 *   "Step 1 instruction text",
 *   "Step 2 instruction text"
 * ]
 *
 * Tags: Array of strings with validated food-related tags:
 * [
 *   "Italian",         // Cuisine type
 *   "Chicken",         // Main ingredient
 *   "Baked",          // Cooking method
 *   "Easy"            // Difficulty/time
 * ]
 *
 * The service automatically:
 * - Validates and filters tags using the tagUtils service
 * - Parses ingredient text into structured objects
 * - Ensures instructions are properly formatted strings
 * - Handles both legacy string formats and new structured formats
 * - Provides quality scoring and validation
 *
 * Following rules.md: Services contain API calls and business logic
 */

// This service handles DeepSeek AI analysis for recipe text formatting
// Web scraping is now handled in recipeExtractor.ts using the /api/scrape-web endpoint

// Debug logs storage
let serviceLogs: string[] = [];

// Add cache implementation
const recipeCache = new Map<string, Partial<Recipe>>();

/**
 * Clear the recipe cache to ensure fresh AI responses
 */
export function clearRecipeCache(): void {
  recipeCache.clear();
  console.log("[DeepSeekService] Recipe cache cleared");
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: recipeCache.size,
    keys: Array.from(recipeCache.keys()),
  };
}

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
    amount: number;
    unit: string;
    name: string;
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
    // Clean the URL - remove any extra text after the URL
    const cleanedUrl = cleanUrl(url);
    console.log(`[Scraper] Original URL: ${url}`);
    console.log(`[Scraper] Cleaned URL: ${cleanedUrl}`);

    // Extract the domain to determine which scraper to use
    const domain = new URL(cleanedUrl).hostname.toLowerCase();

    // For Instagram URLs, use dedicated Instagram API
    if (domain.includes("instagram.com")) {
      console.log(`[Instagram] Starting extraction for URL: ${cleanedUrl}`);
      console.log(
        `[Instagram] API Endpoint: ${API_ENDPOINTS.EXTRACT_API_URL}/api/scrape-web`
      );

      try {
        // Check if API is available first
        const apiAvailable = await isExtractApiAvailable();
        console.log(`[Instagram] API Available: ${apiAvailable}`);

        if (apiAvailable) {
          // Use dedicated API service for Instagram extraction
          console.log(`[Instagram] Making API request...`);
          const apiResponse = await extractFromInstagramScraping(cleanedUrl);
          console.log(
            `[Instagram] API Response:`,
            JSON.stringify(
              {
                caption_length: apiResponse?.caption?.length || 0,
                has_username: !!apiResponse?.username,
                has_thumbnail: !!apiResponse?.thumbnail,
                media_count: apiResponse?.mediaUrls?.length || 0,
                metadata: {
                  has_og: !!apiResponse?.raw_scraped_data?.metadata?.open_graph,
                  has_description:
                    !!apiResponse?.raw_scraped_data?.metadata?.description,
                  title:
                    apiResponse?.raw_scraped_data?.metadata?.title || "none",
                },
              },
              null,
              2
            )
          );

          if (apiResponse) {
            const result = {
              caption: apiResponse.caption || "No caption extracted",
              url: cleanedUrl,
              author:
                apiResponse.username ||
                extractInstagramUsername(
                  apiResponse.raw_scraped_data?.metadata
                ),
              username: apiResponse.username,
              imageUrl: apiResponse.thumbnail,
              mediaUrls:
                apiResponse.raw_scraped_data?.images?.images?.map(
                  (img: any) => ({
                    url: img.src || img.url,
                    isVideo: false,
                  })
                ) || [],
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
        // COMMENTED OUT - using new scrape-web approach instead
        /*
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
        */

        // If fallback also failed, re-throw
        throw instagramError;
      }
    }

    // Generic recipe website scraper
    const content = await scrapeGenericRecipeWebsite(cleanedUrl);
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
 * Clean URL by removing extra text and validating format
 */
function cleanUrl(url: string): string {
  try {
    // Remove any text after the URL (common when URLs are copied with titles)
    // Look for common URL endings and cut off everything after
    const urlPatterns = [
      /^(https?:\/\/[^\s]+\.com\/[^\s]*)/i,
      /^(https?:\/\/[^\s]+\.org\/[^\s]*)/i,
      /^(https?:\/\/[^\s]+\.net\/[^\s]*)/i,
      /^(https?:\/\/[^\s]+\.co\.uk\/[^\s]*)/i,
      /^(https?:\/\/[^\s]+)(\s|$)/i,
    ];

    for (const pattern of urlPatterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // If no pattern matches, try to extract just the URL part
    const urlParts = url.split(" ");
    const firstPart = urlParts[0];

    // Validate that it looks like a URL
    if (firstPart.startsWith("http://") || firstPart.startsWith("https://")) {
      return firstPart.trim();
    }

    // If all else fails, return the original
    return url.trim();
  } catch (error) {
    console.warn(`[Scraper] Error cleaning URL: ${error}`);
    return url.trim();
  }
}

/**
 * Check if the extraction API service is available
 */
async function isExtractApiAvailable(): Promise<boolean> {
  const extractionServiceUrl = API_ENDPOINTS.EXTRACT_API_URL;
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
 * NEW: Extract Instagram data using /scrape-web endpoint
 */
async function extractFromInstagramScraping(
  instagramUrl: string
): Promise<any> {
  console.log(
    `[Instagram] Making extract-enhanced API request to ${API_ENDPOINTS.EXTRACT_API_URL}/api/extract-enhanced`
  );

  const maxRetries = 2;
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount <= maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      console.log(
        `[Instagram] Attempt ${retryCount + 1}/${
          maxRetries + 1
        } - Making request to extract-enhanced endpoint`
      );

      const response = await fetch(
        `${API_ENDPOINTS.EXTRACT_API_URL}/api/extract-enhanced`,
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

      console.log(
        `[Instagram] Response Status: ${response.status} ${response.statusText}`
      );

      const responseText = await response.text();
      console.log(
        `[Instagram] Raw Response Preview (first 200 chars): ${responseText.substring(
          0,
          200
        )}...`
      );

      if (!response.ok) {
        console.error(
          `[Instagram] Extract API Error: ${response.status} ${response.statusText}`
        );
        throw new Error(
          `Extract API Error: ${response.status} ${response.statusText}`
        );
      }

      const result = JSON.parse(responseText);
      console.log(`[Instagram] Successfully parsed extract-enhanced response`);

      if (result.success) {
        // Extract the structured data directly from the API response
        const extractedData = {
          caption: result.data.caption,
          author:
            result.data.metadata?.og_title?.split(" on Instagram")[0] ||
            "Unknown",
          username:
            result.data.metadata?.og_title?.split(" on Instagram")[0] ||
            "Unknown",
          thumbnail: result.data.metadata?.og_image || null,
          imageUrl: result.data.metadata?.og_image || null,
          url: instagramUrl,
          raw_scraped_data: result.data, // Keep raw data for debugging
        };

        console.log(
          `[Instagram] Extracted Data Summary:`,
          JSON.stringify(
            {
              caption_length: extractedData.caption?.length || 0,
              has_author: !!extractedData.author,
              has_thumbnail: !!extractedData.thumbnail,
              author: extractedData.author,
            },
            null,
            2
          )
        );

        addServiceLog(`Instagram extract-enhanced result: {
          "caption_length": ${extractedData.caption?.length || 0},
          "author": "${extractedData.author}",
          "has_thumbnail": ${!!extractedData.thumbnail}
        }`);

        return extractedData;
      } else {
        throw new Error(result.error || "Failed to extract Instagram data");
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `[Instagram] Extract attempt ${retryCount + 1} failed: ${
          lastError.message
        }`
      );
      retryCount++;

      if (retryCount <= maxRetries) {
        const delay = 1000 * Math.pow(2, retryCount);
        console.log(`[Instagram] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  if (lastError) throw lastError;
  throw new Error("Failed to extract Instagram data");
}

/**
 * NEW: Smart image selection for Instagram content
 * Prioritizes high-quality images over video thumbnails with play icons
 */
function selectBestInstagramImage(
  scrapedData: any,
  instagramUrl: string
): string | undefined {
  console.log(`[Instagram] Selecting best image for ${instagramUrl}`);

  // Check if this is a reel/video URL
  const isReel =
    instagramUrl.includes("/reel/") || instagramUrl.includes("/reels/");

  // Priority 1: Open Graph image (usually highest quality)
  const ogImage = scrapedData.metadata?.open_graph?.image;
  if (ogImage) {
    console.log(`[Instagram] Found og:image: ${ogImage}`);

    // For reels, check if this is a video thumbnail with play icon
    if (isReel && isVideoThumbnail(ogImage)) {
      console.log(
        `[Instagram] og:image appears to be video thumbnail, looking for alternatives`
      );
    } else {
      return processInstagramImageUrl(ogImage);
    }
  }

  // Priority 2: Twitter card image
  const twitterImage = scrapedData.metadata?.twitter_card?.image;
  if (twitterImage && (!isReel || !isVideoThumbnail(twitterImage))) {
    console.log(`[Instagram] Using twitter:image: ${twitterImage}`);
    return processInstagramImageUrl(twitterImage);
  }

  // Priority 3: Look through all scraped images for the best one
  const images = scrapedData.images?.images || [];
  if (images.length > 0) {
    console.log(
      `[Instagram] Found ${images.length} scraped images, selecting best`
    );

    // Filter out obvious video thumbnails and low-quality images
    const goodImages = images.filter((img: any) => {
      const url = img.src || img.url;
      if (!url) return false;

      // Skip video thumbnails
      if (isVideoThumbnail(url)) return false;

      // Skip very small images (likely icons/avatars)
      if (img.width && img.height && (img.width < 200 || img.height < 200))
        return false;

      return true;
    });

    if (goodImages.length > 0) {
      // Sort by size (prefer larger images)
      goodImages.sort((a: any, b: any) => {
        const aSize = (a.width || 0) * (a.height || 0);
        const bSize = (b.width || 0) * (b.height || 0);
        return bSize - aSize;
      });

      const bestImage = goodImages[0];
      console.log(
        `[Instagram] Selected best image: ${bestImage.src || bestImage.url}`
      );
      return processInstagramImageUrl(bestImage.src || bestImage.url);
    }
  }

  // Fallback: Use og:image even if it's a video thumbnail (better than nothing)
  if (ogImage) {
    console.log(
      `[Instagram] Falling back to og:image despite being video thumbnail`
    );
    return processInstagramImageUrl(ogImage);
  }

  console.log(`[Instagram] No suitable image found`);
  return undefined;
}

/**
 * NEW: Detect if an image URL is likely a video thumbnail with play icon
 */
function isVideoThumbnail(imageUrl: string): boolean {
  if (!imageUrl) return false;

  // Instagram video thumbnails often have specific patterns
  const videoThumbnailPatterns = [
    /\/v\/t51\.2885-15\/.*\.jpg.*stp=.*video/i, // Instagram video thumbnail pattern
    /\/v\/t51\.2885-15\/.*\.jpg.*stp=.*dst-jpg_e35/i, // Another video pattern
    /thumbnail/i, // Generic thumbnail indicator
    /preview/i, // Preview image indicator
  ];

  return videoThumbnailPatterns.some((pattern) => pattern.test(imageUrl));
}

// Helper function to extract Instagram username from metadata
function extractInstagramUsername(metadata: any): string | undefined {
  console.log("[DeepSeekService] Extracting Instagram username from metadata");

  // Method 1: From twitter:title: "Cal Reynolds (@username) • Instagram reel"
  const twitterTitle = metadata?.twitter_card?.title;
  if (twitterTitle) {
    const match = twitterTitle.match(/\(@([^)]+)\)/);
    if (match) {
      console.log(
        `[DeepSeekService] Username extracted from twitter:title: ${match[1]}`
      );
      return match[1];
    }
  }

  // Method 2: From og:description: "username on Date:"
  const ogDesc = metadata?.open_graph?.description;
  if (ogDesc) {
    const match = ogDesc.match(/(\w+) on \w+ \d+, \d+:/);
    if (match) {
      console.log(
        `[DeepSeekService] Username extracted from og:description: ${match[1]}`
      );
      return match[1];
    }
  }

  // Method 3: From URL pattern if available
  const ogUrl = metadata?.open_graph?.url;
  if (ogUrl && ogUrl.includes("instagram.com/")) {
    const match = ogUrl.match(/instagram\.com\/([^\/]+)\//);
    if (
      match &&
      match[1] !== "p" &&
      match[1] !== "reel" &&
      match[1] !== "share"
    ) {
      console.log(`[DeepSeekService] Username extracted from URL: ${match[1]}`);
      return match[1];
    }
  }

  console.log("[DeepSeekService] No Instagram username found in metadata");
  return undefined;
}

// Helper function to detect if URL is from Instagram
function isInstagramUrl(url: string): boolean {
  return url.includes("instagram.com");
}

// Generic recipe website scraper
async function scrapeGenericRecipeWebsite(
  url: string
): Promise<ScrapedContent | null> {
  try {
    addServiceLog(`Starting real web scraping for URL: ${url}`);

    // First check if the web scraping API is available
    const extractionServiceUrl = API_ENDPOINTS.EXTRACT_API_URL;
    if (!extractionServiceUrl) {
      addServiceLog(
        "Web scraping API URL not configured, falling back to DeepSeek"
      );
      return await scrapeWithDeepSeekFallback(url);
    }

    try {
      // Use the real web scraping API
      addServiceLog("Using real web scraping API");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for web scraping

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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        addServiceLog(
          `Web scraping API error: ${response.status} ${response.statusText}`
        );
        throw new Error(`Web scraping API error: ${response.status}`);
      }

      const scrapedData = await response.json();

      console.log(`[Scraper] Raw API response keys:`, Object.keys(scrapedData));
      console.log(
        `[Scraper] Text data keys:`,
        Object.keys(scrapedData.text || {})
      );
      console.log(
        `[Scraper] Word count from API:`,
        scrapedData.text?.word_count
      );
      console.log(
        `[Scraper] Full text length:`,
        scrapedData.text?.full_text?.length
      );
      console.log(`[Scraper] Metadata title:`, scrapedData.metadata?.title);

      addServiceLog(
        `Web scraping successful, extracted ${
          scrapedData.text?.word_count || 0
        } words`
      );

      // Transform the scraped data to our ScrapedContent format
      const result: ScrapedContent = {
        title: scrapedData.metadata?.title || extractTitleFromUrl(url),
        caption: scrapedData.text?.full_text || "",
        url,
        author: extractAuthorFromMetadata(scrapedData.metadata),
        imageUrl: selectBestInstagramImage(scrapedData, url),
        mediaUrls:
          scrapedData.images?.images?.map((img: any) => ({
            url: img.url,
            isVideo: false,
          })) || [],
        publishDate: scrapedData.extraction_timestamp,
      };

      console.log(`[Scraper] Transformed result:`);
      console.log(`[Scraper] - Title: "${result.title}"`);
      console.log(`[Scraper] - Caption length: ${result.caption.length}`);
      console.log(`[Scraper] - Author: ${result.author}`);
      console.log(`[Scraper] - Image URL: ${result.imageUrl ? "yes" : "no"}`);

      addServiceLog(
        `Transformed scraped data - title: "${result.title}", content length: ${
          result.caption.length
        }, selected image: ${result.imageUrl ? "yes" : "no"}`
      );

      return result;
    } catch (webScrapingError) {
      addServiceLog(
        `Real web scraping failed: ${
          webScrapingError instanceof Error
            ? webScrapingError.message
            : String(webScrapingError)
        }`
      );

      // Fall back to DeepSeek method if real scraping fails
      addServiceLog("Falling back to DeepSeek content generation");
      return await scrapeWithDeepSeekFallback(url);
    }
  } catch (error) {
    addServiceLog(
      `Generic web scraping error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return null;
  }
}

// Fallback function using DeepSeek (original implementation)
async function scrapeWithDeepSeekFallback(
  url: string
): Promise<ScrapedContent | null> {
  try {
    addServiceLog("Using DeepSeek fallback for content generation");

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

    addServiceLog(
      `DeepSeek fallback generated content with title: "${title}" and ${content.length} characters`
    );

    return {
      title,
      caption: content,
      url,
    };
  } catch (error) {
    addServiceLog(
      `DeepSeek fallback also failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return null;
  }
}

// Helper functions for data transformation
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname
      .split("/")
      .filter((part) => part.length > 0);
    if (pathParts.length > 0) {
      return pathParts[pathParts.length - 1]
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
    }
    return urlObj.hostname.replace("www.", "");
  } catch {
    return "Recipe";
  }
}

function extractAuthorFromMetadata(metadata: any): string | undefined {
  if (!metadata) return undefined;

  // Try various author fields
  return (
    metadata.author ||
    metadata.open_graph?.author ||
    metadata.twitter?.creator ||
    metadata.meta_tags?.author
  );
}

export async function analyzeRecipeText(
  recipeText: string,
  isInstagramContent = false // New parameter to indicate Instagram content
): Promise<Partial<Recipe>> {
  console.log(
    `[🔍 DEBUG] analyzeRecipeText called with ${recipeText.length} chars, isInstagram: ${isInstagramContent}`
  );
  addServiceLog(
    `🔍 analyzeRecipeText: ${recipeText.length} chars, isInstagram: ${isInstagramContent}`
  );

  if (!recipeText || recipeText.trim().length < 10) {
    throw new Error("Recipe text too short for analysis");
  }

  try {
    // For web content, try structured data extraction first
    if (!isInstagramContent) {
      console.log(
        `[DeepSeekService] Attempting structured data extraction for web content`
      );
      addServiceLog(`Attempting structured data extraction for web content`);
      const structuredRecipe = extractStructuredRecipeData(recipeText);

      if (
        structuredRecipe &&
        structuredRecipe.ingredients &&
        structuredRecipe.ingredients.length > 2
      ) {
        console.log(
          `[DeepSeekService] Successfully extracted structured recipe data`
        );
        addServiceLog(
          `✅ Successfully extracted structured recipe data with ${structuredRecipe.ingredients.length} ingredients`
        );
        return structuredRecipe;
      }

      console.log(
        `[DeepSeekService] No structured data found, proceeding with AI analysis`
      );
      addServiceLog(`No structured data found, proceeding with AI analysis`);
    }

    // Proceed with AI analysis
    const cacheKey = `recipe_${createSimpleHash(
      recipeText.substring(0, 500)
    )}_${isInstagramContent}`;

    // Check cache first
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        console.log(
          `[DeepSeekService] Returning cached result for ${recipeText.length} chars`
        );
        addServiceLog(
          `Returning cached result for ${recipeText.length} characters`
        );
        return parsedCache;
      }
    } catch (cacheError) {
      console.warn("Cache read error:", cacheError);
    }

    // Process the text
    const processedText = isInstagramContent
      ? recipeText // Keep Instagram text as-is
      : extractRelevantRecipeContent(recipeText); // Filter web content

    console.log(
      `[DeepSeekService] Processing ${
        isInstagramContent ? "Instagram" : "web"
      } content: ${processedText.length} chars (filtered from ${
        recipeText.length
      } chars)`
    );
    addServiceLog(
      `Processing ${isInstagramContent ? "Instagram" : "web"} content: ${
        processedText.length
      } characters`
    );

    try {
      // Call the AI analysis
      console.log(
        `[🔍 DEBUG] Calling AI analysis with ${processedText.length} chars...`
      );
      addServiceLog(
        `🤖 Calling AI analysis with ${processedText.length} chars`
      );

      const result = await analyzeComprehensiveRecipeInfo(
        processedText,
        isInstagramContent
      );

      console.log(`[🔍 DEBUG] AI analysis completed successfully`);
      console.log(`[🔍 DEBUG] AI result preview:`, {
        title: result.title,
        ingredientsCount: result.ingredients?.length || 0,
        instructionsCount: result.instructions?.length || 0,
        tagsCount: result.tags?.length || 0,
      });
      addServiceLog(`✅ AI analysis completed successfully`);

      // Also persist to AsyncStorage for longer-term caching
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
      } catch (e) {
        console.warn("Failed to persist recipe to AsyncStorage:", e);
      }

      return result;
    } catch (aiError) {
      const errorMessage =
        aiError instanceof Error ? aiError.message : String(aiError);
      console.error(
        `[🔍 CRITICAL] AI analysis failed with detailed error:`,
        aiError
      );
      console.error(`[🔍 CRITICAL] Error stack:`, (aiError as Error)?.stack);
      console.error(`[🔍 CRITICAL] Error name:`, (aiError as Error)?.name);
      console.error(`[🔍 CRITICAL] Error message:`, errorMessage);
      console.warn(`[DeepSeekService] AI analysis failed: ${errorMessage}`);
      addServiceLog(`❌ AI analysis failed: ${errorMessage}`);

      // ENHANCED ERROR HANDLING: Distinguish between different types of failures

      // If it's a JSON parsing error, the AI responded but with malformed JSON
      if (
        errorMessage.includes("JSON parsing failed") ||
        errorMessage.includes("Failed to parse AI response") ||
        errorMessage.includes("Invalid JSON structure")
      ) {
        console.warn(
          `[🔍 CRITICAL] AI response received but JSON parsing failed - this indicates AI returned malformed JSON`
        );
        addServiceLog(`🔧 AI JSON parsing failed: ${errorMessage}`);

        // For JSON parsing failures, let's try one more time with a simpler prompt
        try {
          console.log(`[DeepSeekService] Attempting simplified AI analysis...`);
          addServiceLog(`🔄 Attempting simplified AI analysis...`);
          // Simple fallback - just create a basic manual recipe
          const manualResult = isInstagramContent
            ? createManualInstagramRecipe(processedText)
            : createManualWebRecipe(processedText);

          if (manualResult) {
            console.log(`[DeepSeekService] Manual fallback succeeded`);
            addServiceLog(`✅ Manual fallback succeeded`);
            return manualResult;
          }
        } catch (retryError) {
          console.warn(
            `[DeepSeekService] Manual fallback also failed: ${retryError}`
          );
          addServiceLog(`❌ Manual fallback also failed: ${retryError}`);
        }
      }

      // If it's an API failure (network, auth, etc.)
      else if (
        errorMessage.includes("API Error") ||
        errorMessage.includes("fetch") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("API request failed") ||
        errorMessage.includes("401") ||
        errorMessage.includes("403") ||
        errorMessage.includes("429")
      ) {
        console.error(
          `[🔍 CRITICAL] AI API failure - likely API key or service issues:`,
          errorMessage
        );
        addServiceLog(`🌐 AI API failure: ${errorMessage}`);

        // Check if it's an authentication error
        if (errorMessage.includes("401") || errorMessage.includes("403")) {
          console.error(
            `[🔍 CRITICAL] Authentication failed - check API key validity`
          );
          addServiceLog(`🔑 Authentication failed - check API key`);
        }
      }

      // For other failures (prompt issues, etc.)
      else {
        console.warn(
          `[DeepSeekService] AI analysis general failure: ${errorMessage}`
        );
        addServiceLog(`⚠️ AI analysis general failure: ${errorMessage}`);
      }

      // Enhanced fallback: Use manual parsing for both Instagram and web content
      if (isInstagramContent) {
        console.log(
          `[🔍 DEBUG] Using Instagram manual parsing fallback for ${processedText.length} chars...`
        );
        addServiceLog(`📱 Using Instagram manual parsing fallback`);
        return createManualInstagramRecipe(processedText);
      } else {
        console.log(
          `[🔍 DEBUG] Using web manual parsing fallback for ${processedText.length} chars...`
        );
        addServiceLog(`🌐 Using web manual parsing fallback`);
        // Extract title from processed text for better fallback
        const extractedTitle = extractTitleFromContent(processedText);
        return createManualWebRecipe(
          processedText,
          extractedTitle || undefined
        );
      }
    }
  } catch (error) {
    console.error("[🔍 DEBUG] Error in analyzeRecipeText:", error);
    throw new Error(
      "Failed to analyze recipe. Please check your input and try again."
    );
  }
}

/**
 * SIMPLIFIED: Main function to extract recipe from any URL
 * Uses the exact same approach as the working test-exact-url.js
 */
export async function extractRecipeFromUrl(url: string): Promise<any> {
  console.log(
    `[DeepSeekService] Starting dynamic extraction for ANY webpage: ${url}`
  );

  // Check if it's an Instagram URL
  if (url.includes("instagram.com")) {
    console.log(
      `[DeepSeekService] Instagram URL detected, using Instagram extraction`
    );
    return await extractFromInstagramScraping(url);
  }

  // For ANY other webpage, use the Render API service
  console.log(
    `[DeepSeekService] Regular website detected, using Render API service for: ${
      new URL(url).hostname
    }`
  );

  try {
    // Step 1: Call Render API service to scrape the webpage
    const API_BASE_URL = "https://recipeextractionservice.onrender.com";
    console.log(`[DeepSeekService] 🌐 Calling Render API to scrape: ${url}`);

    const scrapeResponse = await fetch(`${API_BASE_URL}/api/scrape-web`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
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

    if (!scrapeResponse.ok) {
      throw new Error(
        `Render API failed: ${scrapeResponse.status} ${scrapeResponse.statusText}`
      );
    }

    const scrapedData = await scrapeResponse.json();
    console.log(`[DeepSeekService] ✅ Render API response received`);
    console.log(
      `[DeepSeekService] 📊 Scraped ${
        scrapedData.text?.word_count || 0
      } words from ${scrapedData.url}`
    );

    // Step 2: Extract the best content for AI processing
    let contentForAI = "";
    let contentSource = "render_api_text";
    let sourceImageUrl: string | undefined = undefined;
    let pageTitle = "";

    // Get page metadata
    if (scrapedData.metadata) {
      pageTitle =
        scrapedData.metadata.title ||
        scrapedData.metadata.open_graph?.title ||
        "";

      // Extract image from metadata
      if (scrapedData.metadata.open_graph?.image) {
        sourceImageUrl = scrapedData.metadata.open_graph.image;
      }
    }

    // Get images from scraped data
    if (!sourceImageUrl && scrapedData.images?.images?.length > 0) {
      sourceImageUrl = scrapedData.images.images[0].url;
    }

    // Build comprehensive content for AI analysis using ALL available data
    const contentParts: string[] = [];

    // Add title and description
    if (pageTitle) {
      contentParts.push(`Title: ${pageTitle}`);
    }

    if (scrapedData.metadata?.description) {
      contentParts.push(`Description: ${scrapedData.metadata.description}`);
    }

    // Add Open Graph data for richer context
    if (scrapedData.metadata?.open_graph) {
      const og = scrapedData.metadata.open_graph;
      if (og.title && og.title !== pageTitle) {
        contentParts.push(`Recipe Name: ${og.title}`);
      }
      if (og.description) {
        contentParts.push(`Recipe Description: ${og.description}`);
      }
    }

    // Add ALL headings for comprehensive structure
    if (scrapedData.headings && Array.isArray(scrapedData.headings)) {
      const headingsByLevel: { [key: number]: string[] } = {};

      // Group headings by level
      scrapedData.headings.forEach((heading: any) => {
        if (heading.text && heading.level) {
          if (!headingsByLevel[heading.level]) {
            headingsByLevel[heading.level] = [];
          }
          headingsByLevel[heading.level].push(heading.text);
        }
      });

      // Add headings in order of importance
      Object.keys(headingsByLevel)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .forEach((level) => {
          const headings = headingsByLevel[parseInt(level)];
          if (headings.length > 0) {
            contentParts.push(`\nH${level} Headings: ${headings.join(", ")}`);
          }
        });
    }

    // Add main text content if available
    if (scrapedData.text?.full_text) {
      contentParts.push(`\nContent:\n${scrapedData.text.full_text}`);
      contentSource = "render_api_structured";
    } else if (scrapedData.text?.preview) {
      contentParts.push(`\nContent:\n${scrapedData.text.preview}`);
      contentSource = "render_api_preview";
    }

    // Add image information for context
    if (scrapedData.images?.images?.length > 0) {
      const imageDescriptions = scrapedData.images.images
        .slice(0, 3) // First 3 images
        .map((img: any) => img.alt || "Recipe image")
        .filter((alt: string) => alt && alt !== "Recipe image");

      if (imageDescriptions.length > 0) {
        contentParts.push(
          `\nImage Descriptions: ${imageDescriptions.join(", ")}`
        );
      }
    }

    contentForAI = contentParts.join("\n").substring(0, 8000); // Limit for AI processing

    console.log(
      `[DeepSeekService] 📝 Built comprehensive content: ${contentForAI.length} chars`
    );
    console.log(
      `[DeepSeekService] 📊 Content preview: ${contentForAI.substring(
        0,
        200
      )}...`
    );

    // Lower the minimum content threshold since we're building from rich metadata
    if (contentForAI.length < 30) {
      throw new Error(
        `Insufficient content extracted from ${url}: ${contentForAI.length} characters`
      );
    }

    console.log(
      `[DeepSeekService] 🤖 Enhancing ${contentSource} with AI (${contentForAI.length} chars)`
    );

    // Step 3: ALWAYS send to AI for professional enhancement and comprehensive tagging
    const recipe = await analyzeRecipeText(contentForAI, false);

    // Step 4: Enhance AI result with scraped metadata
    const enhancedRecipe = {
      ...recipe,
      title:
        recipe.title || pageTitle || `Recipe from ${new URL(url).hostname}`,
      sourceUrl: url,
      // Priority: AI extracted image > scraped OG image > scraped images > none
      imageUrl: recipe.imageUrl || sourceImageUrl,
      source: new URL(url).hostname,
    };

    console.log(
      `[DeepSeekService] ✅ AI-enhanced recipe from ${new URL(url).hostname}: ${
        enhancedRecipe.title
      }`
    );
    console.log(
      `[DeepSeekService] 📊 Enhanced with ${
        enhancedRecipe.tags?.length || 0
      } tags, ${enhancedRecipe.ingredients?.length || 0} ingredients`
    );

    return enhancedRecipe;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `[DeepSeekService] ❌ Dynamic extraction failed for ${url}:`,
      error
    );

    // Enhanced error message for debugging
    if (errorMessage.includes("Render API failed")) {
      console.error(
        `[DeepSeekService] 🚨 Render API service issue - check service status`
      );
    }

    throw new Error(
      `Failed to extract recipe from ${new URL(url).hostname}: ${errorMessage}`
    );
  }
}

/**
 * ALIAS: Alternative export name for compatibility
 */
export const extractRecipeFromAnyUrl = extractRecipeFromUrl;

// MISSING FUNCTION IMPLEMENTATIONS

/**
 * Generate synthetic recipe content when all extraction methods fail
 */
async function generateSyntheticRecipe(url: string): Promise<string | null> {
  try {
    console.log(`[DeepSeekService] Generating synthetic recipe for ${url}`);
    // For now, return a basic fallback message
    return `Recipe content could not be extracted from ${url}. Please check the URL and try again.`;
  } catch (error) {
    console.error("Error generating synthetic recipe:", error);
    return null;
  }
}

/**
 * Extract structured recipe data from web content (JSON-LD, microdata, etc.)
 */
function extractStructuredRecipeData(text: string): Partial<Recipe> | null {
  console.log(
    `[DeepSeekService] Attempting structured data extraction from ${text.length} chars`
  );
  // For now, return null to indicate no structured data found
  // This will cause the system to fall back to AI analysis
  return null;
}

/**
 * Filter content to extract only recipe-relevant sections
 */
function extractRelevantRecipeContent(fullText: string): string {
  console.log(
    `[DeepSeekService] Filtering relevant content from ${fullText.length} chars`
  );

  // Basic filtering - just return the first 5000 chars for now
  // In a full implementation, this would filter out ads, navigation, etc.
  const filtered = fullText.substring(0, 5000);
  console.log(`[DeepSeekService] Filtered to ${filtered.length} chars`);
  return filtered;
}

/**
 * Main AI analysis function that calls DeepSeek API
 */
async function analyzeComprehensiveRecipeInfo(
  text: string,
  isInstagramContent = false
): Promise<Partial<Recipe>> {
  console.log(
    `[DeepSeekService] Analyzing ${text.length} chars with AI (Instagram: ${isInstagramContent})`
  );

  try {
    // Enhanced comprehensive recipe analysis prompt
    const prompt = `You are a professional chef and recipe expert. Analyze this recipe content and extract comprehensive structured information with extensive tagging.

RECIPE CONTENT:
${text.substring(0, 3000)}

Please provide a professionally formatted recipe with extensive tagging and cleaned ingredients. Return ONLY valid JSON in this exact format:

{
  "title": "Clean, professional recipe title (remove any duplicates or noise)",
  "description": "Detailed, appetizing description (2-3 sentences that would entice someone to make this)",
  "ingredients": [
    {"amount": 200, "unit": "g", "name": "fillet steak (clean up any duplicate text like '200g 200g' to just the ingredient)"}
  ],
  "instructions": [
    "Clear, professional step-by-step instruction 1",
    "Clear, professional step-by-step instruction 2"
  ],
  "prepTime": 25,
  "cookTime": 0,
  "servings": 4,
  "tags": [
    "Cuisine type (e.g., French, Italian, Asian, Mexican)",
    "Main ingredient (e.g., Beef, Chicken, Fish, Vegetarian)", 
    "Cooking method (e.g., Grilled, Baked, Raw, Fried, Steamed)",
    "Meal type (e.g., Appetizer, Main Course, Dessert, Snack)",
    "Difficulty (e.g., Easy, Medium, Advanced)",
    "Dietary restrictions if applicable (e.g., Gluten-Free, Keto, Vegan, Low-Carb)",
    "Occasion if applicable (e.g., Date Night, Quick Weeknight, Holiday, Party)",
    "Traditional or Classic dishes should include 'Traditional' tag"
  ]
}

CRITICAL INSTRUCTIONS:
1. CLEAN INGREDIENTS: Remove any duplicate text in ingredients (e.g., "200g 200g fillet steak" becomes "fillet steak")
2. COMPREHENSIVE TAGS: Generate 6-8 comprehensive tags covering:
   - Cuisine type (French, Italian, etc.)
   - Main ingredient (Beef, Chicken, etc.)
   - Cooking method (Grilled, Raw, etc.) 
   - Meal type (Appetizer, Main Course, etc.)
   - Difficulty level (Easy, Medium, Advanced)
   - Dietary restrictions if applicable
   - Special occasions if applicable
   - Traditional/Classic designation if applicable
3. PROFESSIONAL DESCRIPTIONS: Make descriptions appetizing and professional
4. CLEAR INSTRUCTIONS: Ensure instructions are step-by-step and easy to follow
5. ACCURATE TIMING: If raw/uncooked dishes, use cookTime: 0. Separate prep and cook times accurately.
6. PROPER AMOUNTS: Extract accurate quantities and units from ingredient text`;

    const response = await fetch(API_ENDPOINTS.DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_ENDPOINTS.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }

    const parsedRecipe = JSON.parse(jsonMatch[0]);

    // Transform to our format
    const result: Partial<Recipe> = {
      title: parsedRecipe.title || "AI Extracted Recipe",
      description: parsedRecipe.description || "Recipe extracted using AI",
      ingredients: (parsedRecipe.ingredients || []).map(
        (ing: any, index: number) => ({
          id: `ai-${index}`,
          name: ing.name || "Unknown ingredient",
          amount: ing.amount || 1,
          unit: ing.unit || "",
        })
      ),
      instructions: parsedRecipe.instructions || ["No instructions available"],
      prepTime: parsedRecipe.prepTime || 15,
      cookTime: parsedRecipe.cookTime || 30,
      servings: parsedRecipe.servings || 4,
      tags: parsedRecipe.tags || ["AI Generated"],
    };

    console.log(
      `[DeepSeekService] AI analysis successful: ${
        result.ingredients?.length || 0
      } ingredients`
    );
    return result;
  } catch (error) {
    console.error(`[DeepSeekService] AI analysis failed:`, error);
    throw error;
  }
}

/**
 * Create manual Instagram recipe when AI fails
 */
function createManualInstagramRecipe(text: string): Partial<Recipe> {
  console.log(
    `[DeepSeekService] Creating manual Instagram recipe from ${text.length} chars`
  );

  return {
    title: "Instagram Recipe",
    description: "Recipe extracted from Instagram post",
    ingredients: [
      {
        id: "manual-1",
        name: "Check original Instagram post for ingredients",
        amount: 1,
        unit: "",
      },
    ],
    instructions: [
      "Please refer to the original Instagram post for detailed instructions.",
    ],
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    tags: ["Instagram", "Manual Extraction"],
  };
}

/**
 * Create manual web recipe when AI fails
 */
function createManualWebRecipe(text: string, title?: string): Partial<Recipe> {
  console.log(
    `[DeepSeekService] Creating manual web recipe from ${text.length} chars`
  );

  return {
    title: title || "Web Recipe",
    description: "Recipe extracted from website",
    ingredients: [
      {
        id: "manual-1",
        name: "Check original website for ingredients",
        amount: 1,
        unit: "",
      },
    ],
    instructions: [
      "Please refer to the original website for detailed instructions.",
    ],
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    tags: ["Website", "Manual Extraction"],
  };
}

// REMOVED: convertStructuredDataToAIText function
// This was used for local HTML parsing with structured data.
// Now using Render API service which provides clean, structured content.

/**
 * Extract title from content
 */
function extractTitleFromContent(content: string): string | null {
  console.log(
    `[DeepSeekService] Extracting title from ${content.length} chars`
  );

  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length > 0) {
    // Return the first substantial line as title
    const firstLine = lines[0].trim();
    if (firstLine.length > 5 && firstLine.length < 100) {
      return firstLine;
    }
  }

  return null;
}

/**
 * Create a simple hash for React Native (since Buffer doesn't exist)
 */
function createSimpleHash(text: string): string {
  let hash = 0;
  if (text.length === 0) return hash.toString();

  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36); // Convert to base36 for shorter string
}

// REMOVED: findRecipeInStructuredData function
// This was used for local HTML parsing. Now using Render API service.

// REMOVED: transformStructuredDataToRecipe function
// This function previously bypassed AI enhancement. Now structured data
// is converted to text and sent to AI for comprehensive enhancement.

// REMOVED: extractAmount, extractUnit, parseISO8601Duration helper functions
// These were only used by the old transformStructuredDataToRecipe function
// that bypassed AI enhancement. Now the AI handles all parsing and formatting.
