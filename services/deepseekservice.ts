import { Recipe, Ingredient } from "../types";
import { API_ENDPOINTS } from "../constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatTag } from "./utils";

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
              caption:
                apiResponse.caption || apiResponse.ingredients.join("\n"),
              url,
              author: extractInstagramUsername(apiResponse.metadata),
              imageUrl: apiResponse.media?.[0]?.url,
              mediaUrls: apiResponse.media?.map(
                (m: { url: string; type: string }) => ({
                  url: m.url,
                  isVideo: m.type === "video",
                })
              ),
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
  const extractionServiceUrl = API_ENDPOINTS.RECIPE_EXTRACTION_SERVICE_URL;
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

  // Get potential thumbnail from images
  let thumbnailUrl = scrapedData.images?.images?.[0]?.src;

  // For Instagram, try to get image from metadata first
  if (isInstagramUrl(instagramUrl)) {
    const ogImage = scrapedData.metadata?.open_graph?.image;
    const twitterImage = scrapedData.metadata?.twitter_card?.image;

    // Prefer og:image or twitter:image for Instagram posts
    if (ogImage) {
      thumbnailUrl = processInstagramImageUrl(ogImage);
      console.log(
        `[DeepSeekService] Using og:image for Instagram: ${thumbnailUrl}`
      );
    } else if (twitterImage) {
      thumbnailUrl = processInstagramImageUrl(twitterImage);
      console.log(
        `[DeepSeekService] Using twitter:image for Instagram: ${thumbnailUrl}`
      );
    } else if (thumbnailUrl) {
      thumbnailUrl = processInstagramImageUrl(thumbnailUrl);
      console.log(
        `[DeepSeekService] Processing scraped image for Instagram: ${thumbnailUrl}`
      );
    }
  }

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

// Helper function to process Instagram image URLs
function processInstagramImageUrl(
  imageUrl: string | undefined
): string | undefined {
  if (!imageUrl) return undefined;

  console.log(`[DeepSeekService] Processing Instagram image URL: ${imageUrl}`);

  // Check if it's an Instagram CDN URL
  if (imageUrl.includes("cdninstagram.com") || imageUrl.includes("fbcdn.net")) {
    console.log("[DeepSeekService] Detected Instagram CDN URL");

    // For Instagram CDN URLs, we can try using an image proxy service
    // This helps with CORS issues and provides better reliability
    try {
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(
        imageUrl
      )}&w=640&h=640&fit=cover&output=jpg`;
      console.log(`[DeepSeekService] Generated proxy URL: ${proxyUrl}`);
      return proxyUrl;
    } catch (error) {
      console.warn(
        "[DeepSeekService] Failed to generate proxy URL, using original:",
        error
      );
      return imageUrl;
    }
  }

  return imageUrl;
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
    const extractionServiceUrl = API_ENDPOINTS.RECIPE_EXTRACTION_SERVICE_URL;
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
        imageUrl: scrapedData.images?.images?.[0]?.url,
        mediaUrls:
          scrapedData.images?.images?.map((img: any) => ({
            url: img.url,
            isVideo: false,
          })) || [],
        publishDate: scrapedData.extraction_timestamp,
      };

      addServiceLog(
        `Transformed scraped data - title: "${result.title}", content length: ${result.caption.length}`
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

    // SIMPLIFIED: Use single comprehensive analysis instead of splitting
    // The two-part approach was causing data loss where ingredients/instructions
    // were returned in the wrong analysis part
    console.log(
      `[DeepSeekService] Using single comprehensive analysis approach`
    );

    // Comprehensive recipe analysis in a single call
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

// Comprehensive recipe analysis in a single call
async function analyzeComprehensiveRecipeInfo(text: string) {
  const prompt = `You are a comprehensive recipe extraction assistant. Extract ALL information from this recipe text and return it as a valid JSON object.

CRITICAL: Include ALL fields below - this is a complete extraction, not partial.

Required format - respond with ONLY valid JSON:
{
  "title": "Recipe Title",
  "description": "Brief description of the recipe",
  "ingredients": [
    "1 tablespoon olive oil",
    "1 pound ground beef",
    "2 cloves garlic, minced"
  ],
  "instructions": [
    "Heat oil in pan over medium heat",
    "Cook beef until browned, about 5 minutes", 
    "Add garlic and cook 1 minute more"
  ],
  "prep_time": 15,
  "cook_time": 30,
  "servings": 4,
  "tags": ["Greek", "Chicken", "Quick"],
  "meal_type": ["Dinner", "Lunch"],
  "cuisine_type": ["Greek"],
  "dietary_categories": ["High-Protein", "Mediterranean"]
}

IMPORTANT RULES:
1. Extract ALL ingredients as complete strings (with quantities)
2. Extract ALL instructions as step-by-step strings
3. Include title, description, prep_time, cook_time, servings
4. Add appropriate tags and categories
5. Return ONLY the JSON object, no explanations or code blocks

Recipe text:
${text}

Return ONLY the JSON object, no explanations or code blocks.`;

  const response = await callDeepSeekAPI(prompt);
  return parseDeepSeekResponse(response);
}

/*
// OLD: Split recipe analysis into smaller tasks - COMMENTED OUT
// This approach was causing data loss where ingredients were returned in nutrition analysis
// and basic analysis wasn't returning the actual recipe data
async function analyzeBasicRecipeInfo(text: string) {
  // ... old function commented out
}

async function analyzeNutritionInfo(text: string) {
  // ... old function commented out  
}
*/

// Helper function for API calls with retries
async function callDeepSeekAPI(
  prompt: string,
  retries = 3
): Promise<DeepseekResponse> {
  addServiceLog(`Calling DeepSeek API (${prompt.length} chars)`);

  // Use exponential backoff for retries
  const INITIAL_TIMEOUT = 45000; // 45 seconds initial timeout
  const MAX_TIMEOUT = 90000; // 90 seconds max timeout

  for (let i = 0; i < retries; i++) {
    try {
      addServiceLog(`DeepSeek API attempt ${i + 1}/${retries}`);

      const controller = new AbortController();
      const timeout = Math.min(INITIAL_TIMEOUT * Math.pow(1.5, i), MAX_TIMEOUT);

      // Set timeout with clear message
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
          temperature: 0.2,
          max_tokens: 2048,
        }),
        signal: controller.signal,
      });

      // Clear timeout as soon as response is received
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

      if (error instanceof Error && error.name === "AbortError") {
        addServiceLog("Request was aborted (timeout)");
      }

      if (i === retries - 1) {
        addServiceLog(`All ${retries} attempts failed`);
        throw error;
      }

      const backoffTime = Math.pow(2, i) * 1000;
      addServiceLog(`Retrying in ${backoffTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
    }
  }
  throw new Error("Failed after all retries");
}

// Helper function to parse DeepSeek response
function parseDeepSeekResponse(response: DeepseekResponse): Partial<Recipe> {
  const content = response.choices[0]?.message?.content || "";

  try {
    console.log(
      `[DeepSeekService] Raw response content: ${content.substring(0, 500)}...`
    );

    // First try to extract JSON between code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    let jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();

    console.log(
      `[DeepSeekService] Initial JSON extraction: ${jsonString.substring(
        0,
        300
      )}...`
    );

    // If no JSON was found in code blocks, try to find JSON object in the content
    if (!jsonString.startsWith("{")) {
      const objectMatch = content.match(/{[\s\S]*}/);
      if (objectMatch) {
        jsonString = objectMatch[0];
        console.log(
          `[DeepSeekService] Extracted JSON object: ${jsonString.substring(
            0,
            300
          )}...`
        );
      } else {
        console.error("Failed to extract JSON from response content:", content);
        throw new Error("No valid JSON found in response");
      }
    }

    console.log(
      `[DeepSeekService] Before fixing - JSON length: ${jsonString.length}`
    );

    // Clean up the JSON string
    const fixedJsonString = fixCommonJsonErrors(jsonString);

    console.log(
      `[DeepSeekService] After fixing - JSON length: ${fixedJsonString.length}`
    );
    console.log(
      `[DeepSeekService] Fixed JSON sample: ${fixedJsonString.substring(
        0,
        500
      )}...`
    );

    // Try to parse the fixed JSON
    let parsedRecipe: any;
    try {
      parsedRecipe = JSON.parse(fixedJsonString);
      console.log(
        `[DeepSeekService] Successfully parsed JSON with keys: ${Object.keys(
          parsedRecipe
        ).join(", ")}`
      );
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
      console.error("Failed JSON string:", fixedJsonString);
      throw new Error("Failed to parse DeepSeek response JSON");
    }

    // Extract information into the Recipe format
    const result: Partial<Recipe> = {};

    // Basic information
    result.title = parsedRecipe.title || parsedRecipe.name;
    result.description = parsedRecipe.description;
    result.prepTime = parsedRecipe.prep_time || parsedRecipe.prepTime;
    result.cookTime = parsedRecipe.cook_time || parsedRecipe.cookTime;
    result.servings = parsedRecipe.servings;
    result.tags = processNutritionalTags(parsedRecipe);

    // Instructions processing - handle different formats
    const instructions: string[] = [];

    console.log(
      `[DeepSeekService] Raw instructions from API: ${JSON.stringify(
        parsedRecipe.instructions,
        null,
        2
      )}`
    );

    if (Array.isArray(parsedRecipe.instructions)) {
      console.log(
        `[DeepSeekService] Processing instructions as array (${parsedRecipe.instructions.length} items)`
      );
      instructions.push(
        ...parsedRecipe.instructions.map(String).filter(Boolean)
      );
    } else if (typeof parsedRecipe.instructions === "string") {
      console.log(`[DeepSeekService] Processing instructions as string`);
      // Split by newlines and filter out empty lines
      instructions.push(
        ...parsedRecipe.instructions
          .split("\n")
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0)
      );
    } else if (parsedRecipe.steps && Array.isArray(parsedRecipe.steps)) {
      console.log(
        `[DeepSeekService] Processing steps as array (${parsedRecipe.steps.length} items)`
      );
      instructions.push(...parsedRecipe.steps.map(String).filter(Boolean));
    } else {
      console.log(`[DeepSeekService] No valid instructions format found`);
    }

    result.instructions = instructions;
    console.log(
      `[DeepSeekService] Final processed instructions count: ${instructions.length}`
    );

    // Process ingredients - handles both array and object formats
    let ingredients: Ingredient[] = [];

    console.log(
      `[DeepSeekService] Raw ingredients from API: ${JSON.stringify(
        parsedRecipe.ingredients,
        null,
        2
      )}`
    );

    if (Array.isArray(parsedRecipe.ingredients)) {
      console.log(
        `[DeepSeekService] Processing ingredients as array (${parsedRecipe.ingredients.length} items)`
      );
      ingredients = parsedRecipe.ingredients.map(
        (ing: any, index: number): Ingredient => {
          const ingredientText =
            typeof ing === "string" ? ing : ing?.name || "Unknown ingredient";

          // Enhanced parsing to extract amount, unit, and name properly
          const { amount, unit, name } = parseIngredientText(ingredientText);

          return {
            id: `temp-${index}`,
            name: name.trim(),
            amount,
            unit: unit.trim(),
          };
        }
      );
    }
    // Handle ingredients as object with sections (the common DeepSeek format)
    else if (
      parsedRecipe.ingredients &&
      typeof parsedRecipe.ingredients === "object" &&
      !Array.isArray(parsedRecipe.ingredients)
    ) {
      console.log(
        `[DeepSeekService] Processing ingredients as object with sections`
      );
      let index = 0;

      // Iterate through each section of ingredients
      for (const [section, items] of Object.entries(parsedRecipe.ingredients)) {
        console.log(
          `[DeepSeekService] Processing section "${section}" with ${
            Array.isArray(items) ? items.length : 0
          } items`
        );
        if (Array.isArray(items)) {
          const sectionIngredients = items.map((item: any) => {
            const ingredientText =
              typeof item === "string"
                ? item
                : item?.name || "Unknown ingredient";

            // Enhanced parsing to extract amount, unit, and name properly
            const { amount, unit, name } = parseIngredientText(ingredientText);

            return {
              id: `temp-${index++}`,
              name: name.trim(),
              amount,
              unit: unit.trim(),
            };
          });

          ingredients = [...ingredients, ...sectionIngredients];
        }
      }
    }

    result.ingredients = ingredients;
    console.log(
      `[DeepSeekService] Final processed ingredients count: ${ingredients.length}`
    );

    // Validate the final result before returning
    const hasTitle = !!result.title;
    const hasIngredients = ingredients.length > 0;
    const hasInstructions = instructions.length > 0;

    console.log(
      `[DeepSeekService] Final result summary: {
        "ingredientsCount": ${ingredients.length},
        "instructionsCount": ${instructions.length},
        "hasTitle": ${hasTitle},
        "hasIngredients": ${hasIngredients},
        "hasInstructions": ${hasInstructions}
      }`
    );

    // If we don't have critical data, log the raw response for debugging
    if (!hasIngredients || !hasInstructions) {
      console.error(
        `[DeepSeekService] Missing critical data. Raw parsed object keys:`,
        Object.keys(parsedRecipe)
      );
      console.error(
        `[DeepSeekService] Raw parsed object:`,
        JSON.stringify(parsedRecipe, null, 2)
      );
    }

    return result;
  } catch (error) {
    console.error("Failed to parse DeepSeek response:", error);
    return {
      title: "Failed to parse recipe",
      description:
        "The AI couldn't properly extract this recipe. Please try with different text or add manually.",
      ingredients: [],
      instructions: [],
    };
  }
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

/**
 * Fix common JSON formatting errors in the DeepSeek response
 */
function fixCommonJsonErrors(jsonString: string): string {
  let fixedJson = jsonString;

  // Remove any HTML tags that might have snuck in
  fixedJson = fixedJson.replace(/<[^>]*>/g, "");

  // Remove any leading/trailing whitespace and non-JSON content
  fixedJson = fixedJson.trim();

  // If the string starts with text before the JSON, try to extract just the JSON part
  const jsonStart = fixedJson.indexOf("{");
  const jsonEnd = fixedJson.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    fixedJson = fixedJson.substring(jsonStart, jsonEnd + 1);
  }

  // Handle the specific problematic pattern in instructions
  // Look for patterns like: "Cook the Ground Beef: "Heat olive oil in a large skillet..."
  // This is a very targeted fix for the exact issue we're seeing

  // Split into lines to process each instruction separately
  const lines = fixedJson.split("\n");

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Only process lines that are clearly instruction array items
    if (
      line.includes('"') &&
      line.includes(': "') &&
      line.includes('" ') &&
      !line.includes('": "')
    ) {
      // This is likely an instruction with embedded quotes
      // Pattern: "Cook the Ground Beef: "Heat olive oil..." and cook", about 3 minutes..."

      // Find the instruction pattern and fix it carefully
      const instructionMatch = line.match(
        /^(\s*"[^"]*: ")([^"]*)"([^"]*)"([^"]*?")/
      );
      if (instructionMatch) {
        const [, prefix, quoted1, middle, quoted2] = instructionMatch;
        const fixed = `${prefix}${quoted1}\\"${middle}\\"${quoted2}`;
        lines[i] = line.replace(instructionMatch[0], fixed);
      }
    }
  }

  fixedJson = lines.join("\n");

  // Fix trailing commas
  fixedJson = fixedJson.replace(/,\s*}/g, "}");
  fixedJson = fixedJson.replace(/,\s*]/g, "]");

  return fixedJson;
}

/**
 * Process tags from the recipe data
 */
function processNutritionalTags(parsedRecipe: any): string[] {
  // Safely process tags from various possible locations in the response
  const processTagsArray = (tagsArray: any[] | undefined): string[] => {
    if (!Array.isArray(tagsArray)) return [];
    return tagsArray
      .filter((tag) => tag && typeof tag === "string")
      .map((tag) => formatTag(tag));
  };

  // Safely process a single tag
  const processTag = (tag: any): string | null => {
    if (!tag || typeof tag !== "string") return null;
    return formatTag(tag);
  };

  // Combine all tag-like fields into a comprehensive tags array
  const allTags = [
    // Process nutritional tags safely
    ...processTagsArray(parsedRecipe.nutritional_tags),
    ...processTagsArray(parsedRecipe.tags),

    // Add dietary categories as tags
    ...processTagsArray(parsedRecipe.dietary_categories),

    // Add cuisine type - handle both string and array formats
    ...(Array.isArray(parsedRecipe.cuisine_type)
      ? processTagsArray(parsedRecipe.cuisine_type)
      : [processTag(parsedRecipe.cuisine_type)].filter(Boolean)),

    // Add cooking method
    processTag(parsedRecipe.cooking_method),

    // Add meal type - handle both string and array formats
    ...(Array.isArray(parsedRecipe.meal_type)
      ? processTagsArray(parsedRecipe.meal_type)
      : [processTag(parsedRecipe.meal_type)].filter(Boolean)),

    // Other possible tag sources
    processTag(parsedRecipe.main_ingredient),
    processTag(parsedRecipe.occasion),
  ].filter(Boolean) as string[]; // Remove any null/undefined values

  // Remove duplicates
  return [...new Set(allTags)];
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
