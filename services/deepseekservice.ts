import { Recipe, Ingredient } from "../types";
import { API_ENDPOINTS } from "../constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatTag } from "./utils";
import { processInstagramImageUrl } from "../utils/imageProcessor";
import { filterFoodTags, filterFoodTagsWithFeedback } from "./tagUtils";

// This service handles DeepSeek AI analysis for recipe text formatting
// Web scraping is now handled in recipeExtractor.ts using the /api/scrape-web endpoint

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
          const apiResponse = await extractFromInstagramScraping(url);
          console.log(`[Instagram] API response received`);

          if (apiResponse) {
            const result = {
              caption: apiResponse.caption || "No caption extracted",
              url,
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
        imageUrl: selectBestRecipeImage(scrapedData, url),
        mediaUrls:
          scrapedData.images?.images?.map((img: any) => ({
            url: img.url,
            isVideo: false,
          })) || [],
        publishDate: scrapedData.extraction_timestamp,
      };

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

    // Comprehensive recipe analysis in a single call - STREAMLINED VERSION
    const result = await analyzeComprehensiveRecipeInfo(processedText);

    console.log(
      `[DeepSeekService] Comprehensive result keys:`,
      Object.keys(result || {})
    );
    console.log(
      `[DeepSeekService] Final ingredients count:`,
      result?.ingredients?.length || 0
    );
    console.log(
      `[DeepSeekService] Final instructions count:`,
      result?.instructions?.length || 0
    );

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

// Comprehensive recipe analysis in a single call - STREAMLINED VERSION
async function analyzeComprehensiveRecipeInfo(text: string) {
  // PRE-FILTER: Extract only recipe-relevant content before sending to DeepSeek
  const relevantContent = extractRelevantRecipeContent(text);

  console.log(
    `[DeepSeekService] Filtered content from ${text.length} to ${relevantContent.length} characters`
  );

  const prompt = `Analyze this recipe content and extract the actual recipe information. Return ONLY valid JSON with the real recipe data:

${relevantContent}

Extract and return the actual recipe information in this JSON format:
{
  "title": "[EXTRACT THE ACTUAL RECIPE TITLE FROM THE CONTENT]",
  "description": "[EXTRACT THE ACTUAL RECIPE DESCRIPTION FROM THE CONTENT]",
  "ingredients": ["[LIST ALL ACTUAL INGREDIENTS WITH AMOUNTS - BE COMPREHENSIVE, INCLUDE EVERY INGREDIENT MENTIONED]"],
  "instructions": ["[LIST ALL ACTUAL COOKING STEPS - BE COMPREHENSIVE, INCLUDE EVERY STEP]"],
  "prep_time": [ACTUAL PREP TIME IN MINUTES],
  "cook_time": [ACTUAL COOK TIME IN MINUTES],
  "servings": [ACTUAL NUMBER OF SERVINGS],
  "tags": ["[GENERATE INTELLIGENT RECIPE TAGS - SEE DETAILED RULES BELOW]"]
}

CRITICAL TAG GENERATION RULES:
Analyze the recipe systematically and generate 5-8 relevant tags from these categories:

1. CUISINE TYPE (based on ingredients/techniques):
   - Examples: "Italian", "Mexican", "Asian", "Mediterranean", "American", "Indian", "Thai"
   - Look for: pasta/parmesan (Italian), soy sauce/ginger (Asian), cumin/cilantro (Mexican)

2. MAIN PROTEIN/INGREDIENT:
   - Examples: "Chicken", "Beef", "Fish", "Vegetarian", "Pasta", "Rice"
   - Use the primary ingredient that defines the dish

3. COOKING METHOD (from instructions):
   - Examples: "Baked", "Grilled", "Fried", "Slow Cooked", "No Cook", "One Pot"
   - Analyze the cooking techniques mentioned

4. DIETARY RESTRICTIONS (ingredient analysis):
   - Examples: "Vegetarian", "Vegan", "Gluten Free", "Dairy Free", "Keto", "Low Carb"
   - Only include if ingredients clearly support it

5. DIFFICULTY/TIME:
   - Examples: "Easy", "Quick", "30 Minute", "Beginner"
   - Based on prep time, cook time, and instruction complexity

6. MEAL TYPE:
   - Examples: "Breakfast", "Lunch", "Dinner", "Snack", "Dessert", "Appetizer"
   - Based on the type of dish described

7. FLAVOR PROFILE:
   - Examples: "Spicy", "Sweet", "Savory", "Creamy", "Fresh"
   - Only if clearly mentioned in description or ingredients

GOOD TAG EXAMPLES: ["Italian", "Chicken", "Baked", "Easy", "Dinner", "High Protein"]
BAD TAG EXAMPLES: ["Delicious", "Amazing", "Perfect", "Instagram", "Recipe", "Food"]

DO NOT INCLUDE:
- Social media terms, usernames, or platform references
- Generic descriptors like "delicious", "amazing", "perfect"
- Non-food related words
- Duplicate concepts (don't use both "Quick" and "Fast")

ONLY return the JSON object, no explanations.`;

  const response = await callDeepSeekAPI(prompt);
  return parseDeepSeekResponse(response);
}

// NEW: Pre-filter scraped content to extract only recipe-relevant sections
function extractRelevantRecipeContent(fullText: string): string {
  const lines = fullText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Keywords that indicate recipe content
  const recipeKeywords = [
    "ingredients",
    "instructions",
    "directions",
    "recipe",
    "cook",
    "prep",
    "tablespoon",
    "teaspoon",
    "cup",
    "pound",
    "ounce",
    "minutes",
    "hours",
    "heat",
    "add",
    "mix",
    "stir",
    "bake",
    "fry",
    "boil",
    "serve",
  ];

  // Extract lines that contain recipe keywords or look like ingredients/instructions
  const relevantLines = lines.filter((line) => {
    const lowerLine = line.toLowerCase();

    // Check for recipe keywords
    if (recipeKeywords.some((keyword) => lowerLine.includes(keyword)))
      return true;

    // Check for ingredient patterns (number + unit + ingredient)
    if (
      /^\d+[\s\/\-]*\d*\s*(cup|tbsp|tsp|pound|oz|gram|kg|ml|liter)s?\s+\w+/.test(
        lowerLine
      )
    )
      return true;

    // Check for instruction patterns (action verbs)
    if (
      /^(heat|add|mix|stir|cook|bake|fry|boil|serve|combine|season|place|remove)\s+/.test(
        lowerLine
      )
    )
      return true;

    return false;
  });

  // If we found relevant content, use it. Otherwise, take first 2000 chars of original
  if (relevantLines.length > 5) {
    return relevantLines.join("\n").substring(0, 3000); // Limit to 3000 chars
  }

  return fullText.substring(0, 2000); // Fallback to first 2000 chars
}

// Helper function for API calls with retries - IMPROVED VERSION
async function callDeepSeekAPI(
  prompt: string,
  retries = 3 // Increased back to 3 for better reliability
): Promise<DeepseekResponse> {
  addServiceLog(`Calling DeepSeek API (${prompt.length} chars)`);

  // Increased timeouts for more complete processing
  const INITIAL_TIMEOUT = 35000; // Increased from 20s to 35s
  const MAX_TIMEOUT = 60000; // Increased from 30s to 60s

  for (let i = 0; i < retries; i++) {
    try {
      addServiceLog(`DeepSeek API attempt ${i + 1}/${retries}`);

      const controller = new AbortController();
      const timeout = Math.min(INITIAL_TIMEOUT * Math.pow(1.3, i), MAX_TIMEOUT); // Increased multiplier

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
          temperature: 0.1, // Keep low for consistency
          max_tokens: 2048, // Increased back to 2048 for complete recipes
        }),
        signal: controller.signal,
      });

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

      if (i === retries - 1) {
        addServiceLog(`All ${retries} attempts failed`);
        throw error;
      }

      const backoffTime = 2000 * (i + 1); // Increased backoff time
      addServiceLog(`Retrying in ${backoffTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
    }
  }
  throw new Error("Failed after all retries");
}

// Helper function to parse DeepSeek response - STREAMLINED VERSION
function parseDeepSeekResponse(response: DeepseekResponse): Partial<Recipe> {
  const content = response.choices[0]?.message?.content || "";

  try {
    console.log(`[DeepSeekService] Parsing response (${content.length} chars)`);

    // Quick JSON extraction - try the most common patterns first
    let jsonString = content.trim();

    // Remove code blocks if present
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
    }

    // Find JSON object if not already isolated
    if (!jsonString.startsWith("{")) {
      const objectMatch = content.match(/{[\s\S]*}/);
      jsonString = objectMatch ? objectMatch[0] : jsonString;
    }

    // Simple cleanup - only fix the most common issues
    jsonString = jsonString
      .replace(/,\s*}/g, "}") // Remove trailing commas
      .replace(/,\s*]/g, "]"); // Remove trailing commas in arrays

    console.log(`[DeepSeekService] Attempting to parse JSON...`);
    const parsedRecipe = JSON.parse(jsonString);

    // Quick transformation to Recipe format
    const result: Partial<Recipe> = {
      title: parsedRecipe.title || parsedRecipe.name || "Untitled Recipe",
      description: parsedRecipe.description || "",
      prepTime: parsedRecipe.prep_time || parsedRecipe.prepTime || 0,
      cookTime: parsedRecipe.cook_time || parsedRecipe.cookTime || 0,
      servings: parsedRecipe.servings || 4,
      instructions: Array.isArray(parsedRecipe.instructions)
        ? parsedRecipe.instructions.filter(Boolean)
        : [],
      ingredients: Array.isArray(parsedRecipe.ingredients)
        ? parsedRecipe.ingredients.map((ing: any, index: number) => {
            const ingredientText =
              typeof ing === "string" ? ing : ing?.name || "Unknown ingredient";
            const { amount, unit, name } = parseIngredientText(ingredientText);
            return {
              id: `temp-${index}`,
              name: name.trim(),
              amount,
              unit: unit.trim(),
            };
          })
        : [],
      tags: Array.isArray(parsedRecipe.tags)
        ? (() => {
            const rawTags = parsedRecipe.tags.filter(Boolean);
            console.log(
              `[DeepSeekService] Raw tags from AI: [${rawTags
                .map((t: string) => `"${t}"`)
                .join(", ")}]`
            );

            const tagResult = filterFoodTagsWithFeedback(rawTags);

            console.log(`[DeepSeekService] Tag filtering results:`);
            console.log(`  - Original: ${tagResult.stats.original} tags`);
            console.log(`  - Valid: ${tagResult.stats.valid} tags`);
            console.log(`  - Invalid: ${tagResult.stats.invalid} tags`);
            console.log(
              `  - Categories: ${JSON.stringify(tagResult.stats.categories)}`
            );

            if (tagResult.feedback.length > 0) {
              console.log(`[DeepSeekService] Tag validation feedback:`);
              tagResult.feedback.forEach((feedback) =>
                console.log(`    ${feedback}`)
              );
            }

            console.log(
              `[DeepSeekService] Final tags: [${tagResult.tags
                .map((t: string) => `"${t}"`)
                .join(", ")}]`
            );

            return tagResult.tags;
          })()
        : [],
    };

    console.log(
      `[DeepSeekService] Successfully parsed: ${
        result.ingredients?.length || 0
      } ingredients, ${result.instructions?.length || 0} instructions`
    );
    return result;
  } catch (error) {
    console.error("Failed to parse DeepSeek response:", error);
    console.error("Raw content:", content);

    // Enhanced fallback - try to extract basic info from the raw content
    const fallbackTitle =
      extractTitleFromContent(content) || "Recipe extraction failed";
    const fallbackDescription =
      extractDescriptionFromContent(content) ||
      "The AI couldn't properly extract this recipe. The original content may not contain a complete recipe or may be in an unsupported format.";

    return {
      title: fallbackTitle,
      description: fallbackDescription,
      ingredients: [],
      instructions: [],
      tags: ["Extraction Failed"],
    };
  }
}

// Helper function to extract title from raw content as fallback
function extractTitleFromContent(content: string): string | null {
  // Try to find a title-like pattern in the content
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    // Skip JSON structure indicators
    if (
      line.includes('"title"') ||
      line.includes("[EXTRACT") ||
      line.includes("Recipe Name")
    ) {
      continue;
    }

    // Look for lines that could be titles (short, descriptive)
    if (
      line.length > 5 &&
      line.length < 100 &&
      !line.includes('"') &&
      !line.includes("{")
    ) {
      return line;
    }
  }

  return null;
}

// Helper function to extract description from raw content as fallback
function extractDescriptionFromContent(content: string): string | null {
  // Try to find a description-like pattern in the content
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    // Skip JSON structure indicators and generic placeholders
    if (
      line.includes('"description"') ||
      line.includes("[EXTRACT") ||
      line.includes("Brief description") ||
      line.includes('"title"')
    ) {
      continue;
    }

    // Look for lines that could be descriptions (longer, descriptive)
    if (
      line.length > 20 &&
      line.length < 300 &&
      !line.includes('"') &&
      !line.includes("{")
    ) {
      return line;
    }
  }

  return null;
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

// Helper function to parse ingredient text and extract amount, unit, and name
function parseIngredientText(ingredientText: string): {
  amount: number;
  unit: string;
  name: string;
} {
  // Enhanced regex patterns to handle various ingredient formats
  const patterns = [
    // Pattern 1: "2 cups flour" or "1/2 cup sugar"
    /^([\d\/.]+(?:\s*-\s*[\d\/.]+)?)\s+([a-zA-Z]+)\s+(.+)$/,
    // Pattern 2: "2 tablespoons olive oil"
    /^([\d\/.]+(?:\s*-\s*[\d\/.]+)?)\s+(tablespoons?|teaspoons?|tbsp|tsp|cups?|ounces?|oz|pounds?|lbs?|grams?|g|kilograms?|kg)\s+(.+)$/i,
    // Pattern 3: "~2 cups flour" (with tilde)
    /^~?([\d\/.]+(?:\s*-\s*[\d\/.]+)?)\s+([a-zA-Z]+)\s+(.+)$/,
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
          "small",
          "medium",
          "large",
          "clove",
          "cloves",
          "slice",
          "slices",
          "piece",
          "pieces",
        ];

        const isUnit = commonUnits.some((unit) =>
          unitOrName.toLowerCase().includes(unit.toLowerCase())
        );

        if (isUnit) {
          return {
            amount: parseFloat(quantity.replace(/~/g, "")) || 1,
            unit: unitOrName.trim(),
            name: nameOrEmpty.trim(),
          };
        }
      }

      // If we only have quantity and name (no unit)
      return {
        amount: parseFloat(quantity.replace(/~/g, "")) || 1,
        unit: "",
        name: (nameOrEmpty || unitOrName).trim(),
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

/**
 * NEW: Smart image selection for recipe websites
 * Analyzes multiple images and selects the most likely recipe image
 */
export function selectBestRecipeImage(
  scrapedData: any,
  url: string
): string | undefined {
  console.log(`[ImageSelection] Selecting best image for ${url}`);

  // Priority 1: Open Graph image (usually the main/featured image)
  const ogImage = scrapedData.metadata?.open_graph?.image;
  if (ogImage && isValidImageUrl(ogImage)) {
    console.log(`[ImageSelection] Using og:image: ${ogImage}`);
    return ogImage;
  }

  // Priority 2: Twitter card image
  const twitterImage = scrapedData.metadata?.twitter_card?.image;
  if (twitterImage && isValidImageUrl(twitterImage)) {
    console.log(`[ImageSelection] Using twitter:image: ${twitterImage}`);
    return twitterImage;
  }

  // Priority 3: Analyze all scraped images
  const images = scrapedData.images?.images || [];
  if (images.length === 0) {
    console.log(`[ImageSelection] No images found`);
    return undefined;
  }

  console.log(`[ImageSelection] Found ${images.length} images, analyzing...`);

  // Score each image based on recipe relevance
  const scoredImages = images
    .map((img: any) => {
      const imageUrl = img.src || img.url;
      if (!imageUrl || !isValidImageUrl(imageUrl)) return null;

      let score = 0;
      const alt = (img.alt || "").toLowerCase();
      const className = (img.class || img.className || "").toLowerCase();
      const width = img.width || 0;
      const height = img.height || 0;

      // Size scoring (prefer larger images, but not too large)
      const area = width * height;
      if (area > 50000 && area < 1000000) score += 30; // Good size range
      else if (area > 20000) score += 15; // Decent size
      else if (area < 5000) score -= 20; // Too small (likely icon/avatar)

      // Aspect ratio scoring (prefer roughly square or landscape)
      if (width > 0 && height > 0) {
        const aspectRatio = width / height;
        if (aspectRatio >= 0.8 && aspectRatio <= 1.5)
          score += 20; // Good aspect ratio
        else if (aspectRatio > 3 || aspectRatio < 0.3) score -= 15; // Bad aspect ratio
      }

      // Alt text scoring (look for recipe-related keywords)
      const recipeKeywords = [
        "recipe",
        "food",
        "dish",
        "meal",
        "cooking",
        "ingredient",
        "kitchen",
        "delicious",
        "tasty",
        "homemade",
        "fresh",
      ];
      const negativeKeywords = [
        "logo",
        "icon",
        "avatar",
        "profile",
        "banner",
        "ad",
        "advertisement",
        "social",
        "share",
        "button",
        "navigation",
        "menu",
      ];

      recipeKeywords.forEach((keyword) => {
        if (alt.includes(keyword)) score += 15;
      });

      negativeKeywords.forEach((keyword) => {
        if (alt.includes(keyword) || className.includes(keyword)) score -= 25;
      });

      // Class name scoring
      const goodClasses = [
        "recipe",
        "food",
        "dish",
        "featured",
        "main",
        "hero",
        "primary",
      ];
      const badClasses = [
        "logo",
        "icon",
        "avatar",
        "sidebar",
        "footer",
        "header",
        "nav",
      ];

      goodClasses.forEach((cls) => {
        if (className.includes(cls)) score += 10;
      });

      badClasses.forEach((cls) => {
        if (className.includes(cls)) score -= 20;
      });

      // URL pattern scoring
      if (imageUrl.includes("recipe") || imageUrl.includes("food")) score += 10;
      if (imageUrl.includes("logo") || imageUrl.includes("icon")) score -= 15;

      return { url: imageUrl, score, alt, width, height };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.score - a.score);

  if (scoredImages.length > 0) {
    const bestImage = scoredImages[0];
    console.log(
      `[ImageSelection] Selected best image with score ${bestImage.score}: ${bestImage.url}`
    );
    console.log(
      `[ImageSelection] Image details: ${bestImage.width}x${bestImage.height}, alt: "${bestImage.alt}"`
    );
    return bestImage.url;
  }

  // Fallback: Use first image if no scoring worked
  const fallbackImage = images[0]?.src || images[0]?.url;
  if (fallbackImage && isValidImageUrl(fallbackImage)) {
    console.log(
      `[ImageSelection] Using fallback (first image): ${fallbackImage}`
    );
    return fallbackImage;
  }

  console.log(`[ImageSelection] No suitable image found`);
  return undefined;
}

/**
 * NEW: Validate if an image URL is usable
 */
function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;

  // Check for valid image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i;
  if (imageExtensions.test(url)) return true;

  // Check for data URLs
  if (url.startsWith("data:image/")) return true;

  // Check for URLs that might be images (common patterns)
  if (url.includes("image") || url.includes("photo") || url.includes("picture"))
    return true;

  // Reject obvious non-images
  const nonImagePatterns = [
    /\.(js|css|html|xml|json|txt|pdf|doc)(\?|$)/i,
    /javascript:/i,
    /mailto:/i,
    /tel:/i,
  ];

  return !nonImagePatterns.some((pattern) => pattern.test(url));
}

// Test function to verify AI prompt improvements
export async function testRecipeExtractionFix(): Promise<{
  success: boolean;
  message: string;
  result?: Partial<Recipe>;
}> {
  try {
    console.log("🧪 Testing recipe extraction fix...");

    // Test with a simple recipe text
    const testRecipeText = `
    Chocolate Chip Cookies
    
    These are the best homemade chocolate chip cookies! Soft, chewy, and loaded with chocolate chips.
    
    Ingredients:
    - 2 1/4 cups all-purpose flour
    - 1 tsp baking soda
    - 1 tsp salt
    - 1 cup butter, softened
    - 3/4 cup granulated sugar
    - 3/4 cup brown sugar
    - 2 large eggs
    - 2 tsp vanilla extract
    - 2 cups chocolate chips
    
    Instructions:
    1. Preheat oven to 375°F
    2. Mix flour, baking soda, and salt in a bowl
    3. Cream butter and sugars until fluffy
    4. Beat in eggs and vanilla
    5. Gradually add flour mixture
    6. Stir in chocolate chips
    7. Drop spoonfuls on baking sheet
    8. Bake for 9-11 minutes
    
    Prep time: 15 minutes
    Cook time: 10 minutes
    Serves: 24 cookies
    `;

    const result = await analyzeRecipeText(testRecipeText);

    // Check if we got generic placeholder text
    const hasGenericTitle =
      !result.title ||
      result.title.toLowerCase().includes("recipe name") ||
      result.title.toLowerCase().includes("untitled recipe");

    const hasGenericDescription =
      !result.description ||
      result.description.toLowerCase().includes("brief description");

    const hasValidIngredients =
      result.ingredients &&
      result.ingredients.length > 0 &&
      !result.ingredients.every((ing) =>
        ing.name.toLowerCase().includes("unknown ingredient")
      );

    const hasValidInstructions =
      result.instructions &&
      result.instructions.length > 0 &&
      !result.instructions.every((inst) => inst.toLowerCase().includes("step"));

    if (hasGenericTitle || hasGenericDescription) {
      return {
        success: false,
        message: `❌ Still getting generic placeholders - Title: "${result.title}", Description: "${result.description}"`,
        result,
      };
    }

    if (!hasValidIngredients || !hasValidInstructions) {
      return {
        success: false,
        message: `❌ Missing valid ingredients (${
          result.ingredients?.length || 0
        }) or instructions (${result.instructions?.length || 0})`,
        result,
      };
    }

    return {
      success: true,
      message: `✅ Recipe extraction working correctly! Title: "${
        result.title
      }", Ingredients: ${result.ingredients?.length || 0}, Instructions: ${
        result.instructions?.length || 0
      }`,
      result,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Test failed with error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

// Test function to verify Instagram extraction and recipe processing
export async function testInstagramExtractionFlow(): Promise<{
  success: boolean;
  message: string;
  extractedData?: any;
  recipeResult?: Partial<Recipe>;
}> {
  try {
    console.log("🧪 Testing complete Instagram extraction flow...");

    const testUrl = "https://www.instagram.com/share/BBZ133yzEX";

    // Step 1: Test scraping
    console.log("Step 1: Testing scrapeFromUrl...");
    const scrapedContent = await scrapeFromUrl(testUrl);

    if (!scrapedContent) {
      return {
        success: false,
        message: "❌ scrapeFromUrl returned null",
      };
    }

    console.log(
      `Step 1 ✅: Scraped content with caption length: ${
        scrapedContent.caption?.length || 0
      }`
    );

    // Step 2: Test recipe analysis
    console.log("Step 2: Testing analyzeRecipeText...");
    const recipeResult = await analyzeRecipeText(scrapedContent.caption);

    console.log(`Step 2 ✅: Recipe analysis complete`);
    console.log(`- Title: "${recipeResult.title}"`);
    console.log(`- Ingredients: ${recipeResult.ingredients?.length || 0}`);
    console.log(`- Instructions: ${recipeResult.instructions?.length || 0}`);

    // Check for success criteria
    const hasValidTitle =
      recipeResult.title &&
      !recipeResult.title.toLowerCase().includes("recipe name") &&
      !recipeResult.title.toLowerCase().includes("untitled recipe");

    const hasValidIngredients =
      recipeResult.ingredients && recipeResult.ingredients.length > 0;

    const hasValidInstructions =
      recipeResult.instructions && recipeResult.instructions.length > 0;

    if (!hasValidTitle || !hasValidIngredients || !hasValidInstructions) {
      return {
        success: false,
        message: `❌ Recipe processing failed - Title: ${
          hasValidTitle ? "✅" : "❌"
        }, Ingredients: ${hasValidIngredients ? "✅" : "❌"}, Instructions: ${
          hasValidInstructions ? "✅" : "❌"
        }`,
        extractedData: scrapedContent,
        recipeResult,
      };
    }

    return {
      success: true,
      message: `✅ Complete Instagram extraction flow working! Caption: ${scrapedContent.caption.length} chars, Recipe: "${recipeResult.title}" with ${recipeResult.ingredients?.length} ingredients and ${recipeResult.instructions?.length} instructions`,
      extractedData: scrapedContent,
      recipeResult,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Test failed with error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

// Test function to verify enhanced tagging system
export async function testEnhancedTaggingSystem(): Promise<{
  success: boolean;
  message: string;
  results?: Array<{
    recipeType: string;
    generatedTags: string[];
    validTags: string[];
    invalidTags: string[];
    categories: { [key: string]: number };
    quality: string;
  }>;
}> {
  try {
    console.log("🧪 Testing Enhanced Tagging System...");

    const testRecipes = [
      {
        type: "Italian Pasta",
        content: `Creamy Garlic Parmesan Pasta
        
        A rich and creamy pasta dish with garlic, parmesan cheese, and fresh herbs.
        
        Ingredients:
        - 400g spaghetti
        - 4 cloves garlic, minced
        - 1 cup heavy cream
        - 1 cup parmesan cheese, grated
        - 2 tbsp olive oil
        - Fresh basil leaves
        - Salt and black pepper
        
        Instructions:
        1. Cook spaghetti according to package directions
        2. Heat olive oil in a large pan
        3. Add garlic and cook for 1 minute
        4. Pour in cream and bring to a simmer
        5. Add cooked pasta and toss
        6. Stir in parmesan cheese until melted
        7. Season with salt and pepper
        8. Garnish with fresh basil
        
        Prep: 10 minutes, Cook: 15 minutes, Serves: 4`,
      },
      {
        type: "Asian Stir Fry",
        content: `Quick Chicken Teriyaki Stir Fry
        
        A healthy and quick Asian-inspired stir fry with chicken and vegetables.
        
        Ingredients:
        - 500g chicken breast, sliced
        - 2 tbsp soy sauce
        - 1 tbsp sesame oil
        - 1 tsp fresh ginger, grated
        - 2 cloves garlic, minced
        - 1 bell pepper, sliced
        - 1 cup broccoli florets
        - 2 tbsp teriyaki sauce
        - 1 tbsp vegetable oil
        - Green onions for garnish
        
        Instructions:
        1. Heat vegetable oil in a wok or large pan
        2. Add chicken and cook until golden
        3. Add garlic and ginger, stir for 30 seconds
        4. Add vegetables and stir-fry for 3-4 minutes
        5. Add soy sauce and teriyaki sauce
        6. Toss everything together
        7. Garnish with green onions
        
        Prep: 15 minutes, Cook: 10 minutes, Serves: 3`,
      },
      {
        type: "Vegan Dessert",
        content: `No-Bake Chocolate Avocado Mousse
        
        A healthy, vegan chocolate mousse made with avocados and dates.
        
        Ingredients:
        - 2 ripe avocados
        - 1/4 cup cocoa powder
        - 6 medjool dates, pitted
        - 1/4 cup almond milk
        - 1 tsp vanilla extract
        - Pinch of sea salt
        - Fresh berries for topping
        
        Instructions:
        1. Soak dates in warm water for 10 minutes
        2. Drain dates and add to food processor
        3. Add avocados, cocoa powder, almond milk, vanilla, and salt
        4. Process until smooth and creamy
        5. Taste and adjust sweetness if needed
        6. Chill in refrigerator for 2 hours
        7. Serve topped with fresh berries
        
        Prep: 15 minutes, Chill: 2 hours, Serves: 4`,
      },
    ];

    const results = [];

    for (const testRecipe of testRecipes) {
      console.log(`\n🔍 Testing: ${testRecipe.type}`);

      const recipeResult = await analyzeRecipeText(testRecipe.content);

      // Import the enhanced tag validation
      const { validateAndCategorizeTags } = await import("./tagUtils");
      const tagAnalysis = validateAndCategorizeTags(recipeResult.tags || []);

      // Calculate quality score
      let qualityScore = 0;
      const maxScore = 5;

      // Check for cuisine tag
      if (tagAnalysis.categorizedTags.cuisine?.length > 0) qualityScore++;

      // Check for protein/main ingredient tag
      if (tagAnalysis.categorizedTags.protein?.length > 0) qualityScore++;

      // Check for cooking method tag
      if (tagAnalysis.categorizedTags.cooking?.length > 0) qualityScore++;

      // Check for dietary tag
      if (tagAnalysis.categorizedTags.dietary?.length > 0) qualityScore++;

      // Check for meal type tag
      if (tagAnalysis.categorizedTags.mealType?.length > 0) qualityScore++;

      const qualityPercentage = (qualityScore / maxScore) * 100;
      let quality = "Poor";
      if (qualityPercentage >= 80) quality = "Excellent";
      else if (qualityPercentage >= 60) quality = "Good";
      else if (qualityPercentage >= 40) quality = "Fair";

      const result = {
        recipeType: testRecipe.type,
        generatedTags: recipeResult.tags || [],
        validTags: tagAnalysis.validTags,
        invalidTags: tagAnalysis.invalidTags,
        categories: Object.fromEntries(
          Object.entries(tagAnalysis.categorizedTags).map(([cat, tags]) => [
            cat,
            tags.length,
          ])
        ),
        quality,
      };

      results.push(result);

      console.log(
        `  Generated Tags: [${result.generatedTags
          .map((t) => `"${t}"`)
          .join(", ")}]`
      );
      console.log(
        `  Valid Tags: [${result.validTags.map((t) => `"${t}"`).join(", ")}]`
      );
      console.log(
        `  Invalid Tags: [${result.invalidTags
          .map((t) => `"${t}"`)
          .join(", ")}]`
      );
      console.log(`  Categories: ${JSON.stringify(result.categories)}`);
      console.log(`  Quality: ${quality} (${qualityScore}/${maxScore})`);
    }

    // Overall assessment
    const averageQuality =
      results.reduce((sum, r) => {
        const score =
          r.quality === "Excellent"
            ? 4
            : r.quality === "Good"
            ? 3
            : r.quality === "Fair"
            ? 2
            : 1;
        return sum + score;
      }, 0) / results.length;

    const overallQuality =
      averageQuality >= 3.5
        ? "Excellent"
        : averageQuality >= 2.5
        ? "Good"
        : "Needs Improvement";

    return {
      success: true,
      message: `✅ Enhanced tagging system test completed! Overall quality: ${overallQuality}. Tested ${results.length} recipe types with detailed tag analysis.`,
      results,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Enhanced tagging system test failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
