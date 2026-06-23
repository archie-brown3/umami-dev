// Node.js 18+ has built-in fetch

/**
 * DeepSeek AI Recipe Analysis Service
 *
 * Converted from TypeScript to Node.js
 * Handles AI-powered recipe extraction and analysis using the DeepSeek API
 */

// Cache implementation
const recipeCache = new Map();
let serviceLogs = [];

/**
 * Clear the recipe cache to ensure fresh AI responses
 */
function clearRecipeCache() {
  recipeCache.clear();
  console.log("[DeepSeekService] Recipe cache cleared");
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return {
    size: recipeCache.size,
    keys: Array.from(recipeCache.keys()),
  };
}

/**
 * Add log entries
 */
function addServiceLog(message) {
  const logEntry = `[${new Date().toISOString()}] ${message}`;
  console.log(`[DeepSeekService] ${message}`);
  serviceLogs.push(logEntry);

  // Keep logs limited to most recent 100 entries
  if (serviceLogs.length > 100) {
    serviceLogs = serviceLogs.slice(-100);
  }
}

/**
 * Get all service logs
 */
function getServiceLogs() {
  return [...serviceLogs];
}

/**
 * Clear service logs
 */
function clearServiceLogs() {
  serviceLogs = [];
}

/**
 * Call DeepSeek API with error handling and timeout
 */
async function callDeepSeekAPI(prompt, maxTokens = 4096) {
  console.log(
    `[DeepSeekService] Calling API with ${prompt.length} character prompt`
  );

  const controller = new AbortController();
  const timeout = 45000; // 45 second timeout

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => "Failed to get error text");
      throw new Error(
        `API request failed with status ${response.status}: ${errorText}`
      );
    }

    const data = await response.json();
    console.log(`[DeepSeekService] API call successful`);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[DeepSeekService] API call failed:`, error);
    throw error;
  }
}

/**
 * Create optimized prompt for recipe extraction
 */
function createRecipeExtractionPrompt(content, isInstagramContent = false) {
  const contextNote = isInstagramContent
    ? "This content is from Instagram and may contain casual language, hashtags, and social media formatting."
    : "This content is from a webpage or text input.";

  return `${contextNote}

Please extract and structure the recipe information from the following content. Return ONLY a valid JSON object with this exact structure:

{
  "title": "Recipe name",
  "description": "Brief description (optional)",
  "ingredients": [
    {
      "amount": 2,
      "unit": "cups",
      "name": "flour, all-purpose"
    }
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction"
  ],
  "tags": ["Italian", "Pasta", "Easy"],
  "cookingTime": 30,
  "servings": 4,
  "difficulty": "easy"
}

Important rules:
- Return ONLY the JSON object, no additional text
- Use numbers for amounts (convert fractions to decimals)
- Keep ingredient names descriptive but concise
- Instructions should be clear, actionable steps
- Tags should be relevant food categories, cuisines, or cooking methods
- cookingTime in minutes, servings as integer
- difficulty: "easy", "medium", or "hard"

Content to analyze:
${content}`;
}

/**
 * Analyze recipe text and return structured data
 */
async function analyzeRecipeText(recipeText, isInstagramContent = false) {
  try {
    addServiceLog(
      `Starting recipe analysis for ${
        isInstagramContent ? "Instagram" : "text"
      } content`
    );

    // Check cache first
    const cacheKey = `${recipeText.substring(0, 100)}_${isInstagramContent}`;
    if (recipeCache.has(cacheKey)) {
      addServiceLog("Returning cached result");
      return recipeCache.get(cacheKey);
    }

    const prompt = createRecipeExtractionPrompt(recipeText, isInstagramContent);
    const response = await callDeepSeekAPI(prompt);

    if (
      !response.choices ||
      !response.choices[0] ||
      !response.choices[0].message
    ) {
      throw new Error("Invalid response structure from DeepSeek API");
    }

    const content = response.choices[0].message.content.trim();

    // Try to parse JSON response
    let parsedRecipe;
    try {
      // Remove any markdown code block formatting
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      parsedRecipe = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse DeepSeek response as JSON:", parseError);
      throw new Error("Failed to parse recipe data from AI response");
    }

    // Validate and clean the parsed recipe
    const recipe = {
      title: parsedRecipe.title || "Untitled Recipe",
      description: parsedRecipe.description || "",
      ingredients: Array.isArray(parsedRecipe.ingredients)
        ? parsedRecipe.ingredients
        : [],
      instructions: Array.isArray(parsedRecipe.instructions)
        ? parsedRecipe.instructions
        : [],
      tags: Array.isArray(parsedRecipe.tags) ? parsedRecipe.tags : [],
      cookingTime:
        typeof parsedRecipe.cookingTime === "number"
          ? parsedRecipe.cookingTime
          : 0,
      servings:
        typeof parsedRecipe.servings === "number" ? parsedRecipe.servings : 1,
      difficulty: ["easy", "medium", "hard"].includes(parsedRecipe.difficulty)
        ? parsedRecipe.difficulty
        : "medium",
    };

    // Cache the result
    recipeCache.set(cacheKey, recipe);
    addServiceLog(`Recipe analysis completed: ${recipe.title}`);

    return recipe;
  } catch (error) {
    addServiceLog(`Recipe analysis failed: ${error.message}`);
    throw error;
  }
}

/**
 * Scrape content from URL using the Recipe Extraction Service
 */
async function scrapeFromUrl(url) {
  try {
    addServiceLog(`Starting URL scraping for: ${url}`);

    const domain = new URL(url).hostname.toLowerCase();
    const extractionServiceUrl =
      process.env.RECIPE_EXTRACTION_SERVICE_URL ||
      "https://recipeextractionservice.onrender.com";

    // For Instagram URLs, use dedicated Instagram API
    if (domain.includes("instagram.com")) {
      console.log(
        `[DeepSeekService] Instagram URL detected, using Instagram extraction`
      );

      const response = await fetch(`${extractionServiceUrl}/api/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(
          `Instagram extraction failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return {
        text: data.caption || "",
        images: data.media || [],
        title: `Recipe from @${data.username}`,
        publishDate: data.timestamp,
        sourceUrl: url,
      };
    }

    // For other websites, use general web scraping
    console.log(
      `[DeepSeekService] Regular website detected, using web scraping for: ${domain}`
    );

    const response = await fetch(`${extractionServiceUrl}/api/scrape-web`, {
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

    if (!response.ok) {
      throw new Error(
        `Web scraping failed: ${response.status} ${response.statusText}`
      );
    }

    const scrapedData = await response.json();
    addServiceLog(`Web scraping completed for ${domain}`);

    return {
      text: scrapedData.text?.content || "",
      images: scrapedData.images || [],
      title: scrapedData.metadata?.title || "",
      publishDate: scrapedData.metadata?.publishedTime,
      sourceUrl: url,
    };
  } catch (error) {
    addServiceLog(`URL scraping failed: ${error.message}`);
    throw error;
  }
}

/**
 * Extract recipe from any URL
 */
async function extractRecipeFromUrl(url) {
  try {
    addServiceLog(`Starting recipe extraction from URL: ${url}`);

    // Step 1: Scrape content from URL
    const scrapedContent = await scrapeFromUrl(url);

    if (!scrapedContent.text) {
      throw new Error("No text content found at the provided URL");
    }

    // Step 2: Analyze the scraped content with AI
    const isInstagramContent = url.includes("instagram.com");
    const recipe = await analyzeRecipeText(
      scrapedContent.text,
      isInstagramContent
    );

    // Step 3: Enhance with scraped metadata
    const enhancedRecipe = {
      ...recipe,
      sourceUrl: url,
      title: recipe.title || scrapedContent.title || "Extracted Recipe",
      imageUrl:
        scrapedContent.images && scrapedContent.images.length > 0
          ? scrapedContent.images[0].url || scrapedContent.images[0]
          : undefined,
    };

    addServiceLog(`Recipe extraction completed: ${enhancedRecipe.title}`);
    return enhancedRecipe;
  } catch (error) {
    addServiceLog(`Recipe extraction from URL failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  analyzeRecipeText,
  extractRecipeFromUrl,
  scrapeFromUrl,
  clearRecipeCache,
  getCacheStats,
  getServiceLogs,
  clearServiceLogs,
  addServiceLog,
};
