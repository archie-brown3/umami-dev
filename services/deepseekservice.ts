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

      try {
        // Check if API is available first
        const apiAvailable = await isExtractApiAvailable();

        if (apiAvailable) {
          // Use dedicated API service for Instagram extraction
          const apiResponse = await extractFromInstagramScraping(cleanedUrl);
          console.log(`[Instagram] API response received`);

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
    `[Instagram] Making scrape-web API request to ${API_ENDPOINTS.EXTRACT_API_URL}/api/scrape-web`
  );

  const maxRetries = 2;
  let retryCount = 0;
  let lastError: Error | null = null;

  while (retryCount <= maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for scraping

      const response = await fetch(
        `${API_ENDPOINTS.EXTRACT_API_URL}/api/scrape-web`,
        {
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
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      console.log(`[Instagram] Scrape API Response Status: ${response.status}`);

      const responseText = await response.text();
      console.log(
        `[Instagram] Raw Scrape Response: ${responseText.substring(0, 300)}...`
      );

      if (!response.ok) {
        console.error(
          `[Instagram] Scrape API Error: ${response.status} ${response.statusText}`
        );
        throw new Error(
          `Scrape API Error: ${response.status} ${response.statusText}`
        );
      }

      const scrapedData = JSON.parse(responseText);
      console.log(`[Instagram] Successfully parsed scrape response`);

      // Log what we got for testing
      addServiceLog(`Instagram scrape result: {
        "text_length": ${scrapedData.text?.full_text?.length || 0},
        "word_count": ${scrapedData.text?.word_count || 0},
        "images_count": ${scrapedData.images?.total_images || 0},
        "metadata_title": "${scrapedData.metadata?.title || "none"}",
        "has_open_graph": ${!!scrapedData.metadata?.open_graph}
      }`);

      // Extract Instagram-specific data
      const instagramData = extractInstagramDataFromScrape(
        scrapedData,
        instagramUrl
      );
      return instagramData;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `[Instagram] Scrape attempt ${retryCount + 1} failed: ${
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
  throw new Error("Failed to scrape Instagram post");
}

/**
 * Extract Instagram-specific data from scraped content
 */
function extractInstagramDataFromScrape(
  scrapedData: any,
  instagramUrl: string
): any {
  // Extract caption from text content
  const fullText = scrapedData.text?.full_text || "";

  // Try to extract username from URL
  const username = extractInstagramUsername(scrapedData.metadata);

  // ENHANCED: Smart image selection for Instagram content
  let thumbnailUrl = selectBestInstagramImage(scrapedData, instagramUrl);

  // Extract caption - look for patterns in the scraped text
  let caption = "";

  // First try to get from Open Graph description
  if (scrapedData.metadata?.open_graph?.description) {
    caption = scrapedData.metadata.open_graph.description;
  }
  // Then try regular meta description
  else if (scrapedData.metadata?.description) {
    caption = scrapedData.metadata.description;
  }
  // Fallback to looking in the text content
  else if (fullText) {
    // Try to extract meaningful content from the full text
    // This is basic - we'll refine based on test results
    const lines = fullText
      .split("\n")
      .filter((line: string) => line.trim().length > 0);
    caption = lines.slice(0, 3).join(" ").substring(0, 500); // First few lines, max 500 chars
  }

  const result = {
    caption: caption || "No caption extracted",
    username: username || "unknown",
    thumbnail: thumbnailUrl || null,
    url: instagramUrl,
    raw_scraped_data: scrapedData, // Include for testing/debugging
    extraction_method: "scrape-web",
  };

  addServiceLog(`Extracted Instagram data: {
    "caption_length": ${result.caption.length},
    "username": "${result.username}",
    "has_thumbnail": ${!!result.thumbnail}
  }`);

  return result;
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
 * Main function to extract recipe from any URL
 * This is the primary export that the app uses
 */
export async function extractRecipeFromAnyUrl(
  url: string
): Promise<Partial<Recipe>> {
  console.log(`[DeepSeekService] Starting extraction for URL: ${url}`);
  addServiceLog(`Starting extraction for URL: ${url}`);

  try {
    // Step 1: Scrape content from the URL
    const scrapedContent = await scrapeFromUrl(url);

    if (
      !scrapedContent ||
      !scrapedContent.caption ||
      scrapedContent.caption.length < 50
    ) {
      throw new Error(
        `Insufficient content extracted from URL. Got ${
          scrapedContent?.caption?.length || 0
        } characters`
      );
    }

    console.log(
      `[DeepSeekService] Scraped ${scrapedContent.caption.length} characters`
    );
    addServiceLog(`Scraped ${scrapedContent.caption.length} characters`);

    // Step 2: Analyze the content with AI
    const isInstagram = isInstagramUrl(url);
    const recipe = await analyzeRecipeText(scrapedContent.caption, isInstagram);

    // Step 3: Enhance with metadata
    const enhancedRecipe: Partial<Recipe> = {
      ...recipe,
      sourceUrl: url,
      author: scrapedContent.author || scrapedContent.username,
      imageUrl: scrapedContent.imageUrl,
      title: recipe.title || scrapedContent.title || "Extracted Recipe",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log(
      `[DeepSeekService] Extraction complete: ${
        enhancedRecipe.ingredients?.length || 0
      } ingredients, ${enhancedRecipe.instructions?.length || 0} instructions`
    );
    addServiceLog(
      `Extraction complete: ${
        enhancedRecipe.ingredients?.length || 0
      } ingredients, ${enhancedRecipe.instructions?.length || 0} instructions`
    );

    return enhancedRecipe;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[DeepSeekService] Extraction failed: ${errorMessage}`);
    addServiceLog(`❌ Extraction failed: ${errorMessage}`);

    // Return a basic fallback recipe structure
    return {
      title: "Failed Recipe Extraction",
      description: `Failed to extract recipe from ${url}. Please try again or check the URL.`,
      ingredients: [
        {
          id: `fallback-${Date.now()}`,
          name: "Recipe extraction failed",
          amount: 1,
          unit: "",
        },
      ],
      instructions: [
        "Recipe extraction failed. Please try again with a different URL or check your internet connection.",
      ],
      prepTime: 0,
      cookTime: 0,
      servings: 1,
      tags: ["Failed Extraction"],
      sourceUrl: url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

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
    // Use DeepSeek API to analyze the content
    const prompt = `Analyze this recipe content and extract structured information. Return ONLY valid JSON:

${text.substring(0, 2000)}

Return this exact format:
{
  "title": "Recipe title here",
  "description": "Brief description",
  "ingredients": [
    {"amount": 1, "unit": "cup", "name": "ingredient name"}
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction"
  ],
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "tags": ["tag1", "tag2"]
}`;

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
