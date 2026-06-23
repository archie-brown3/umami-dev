import AsyncStorage from "@react-native-async-storage/async-storage";
import { Recipe } from "../types/index";
import { API_ENDPOINTS } from "../constants/api";

// Enhanced content filtering for better recipe detection
function extractOptimizedRecipeContent(fullText: string): string {
  const lines = fullText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Comprehensive keywords for recipe detection
  const recipeKeywords = [
    // Basic recipe terms
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

    // Cooking actions
    "heat",
    "add",
    "mix",
    "stir",
    "bake",
    "fry",
    "boil",
    "serve",
    "combine",
    "season",
    "place",
    "remove",
    "preheat",
    "chop",
    "dice",
    "slice",
    "melt",
    "whisk",
    "fold",
    "simmer",
    "sauté",
    "grill",
    "roast",
    "blend",
    "strain",
    "drain",
    "cool",
    "chill",
    "refrigerate",
    "freeze",

    // Common ingredients
    "salt",
    "pepper",
    "oil",
    "butter",
    "onion",
    "garlic",
    "flour",
    "sugar",
    "water",
    "milk",
    "egg",
    "cheese",
    "chicken",
    "beef",
    "pork",
    "fish",
    "tomato",
    "potato",
    "carrot",
    "celery",
    "herbs",
    "spices",

    // Units and measurements
    "gram",
    "kg",
    "ml",
    "liter",
    "clove",
    "slice",
    "piece",
    "pinch",
    "dash",
  ];

  const relevantLines = lines.filter((line) => {
    const lowerLine = line.toLowerCase();
    const originalLine = line;

    // Check for recipe keywords
    if (recipeKeywords.some((keyword) => lowerLine.includes(keyword)))
      return true;

    // Enhanced ingredient patterns
    if (
      /^\d+[\s\/\-]*\d*\s*(cup|tbsp|tsp|tablespoon|teaspoon|pound|oz|gram|kg|ml|liter|clove|slice|piece|pinch|dash)s?\s+\w+/.test(
        lowerLine
      )
    )
      return true;

    // Enhanced instruction patterns
    if (
      /^(heat|add|mix|stir|cook|bake|fry|boil|serve|combine|season|place|remove|preheat|chop|dice|slice|melt|whisk|fold|simmer|sauté|grill|roast|blend|strain|drain|cool|chill|refrigerate|freeze)\s+/.test(
        lowerLine
      )
    )
      return true;

    // Numbered steps (various formats)
    if (/^\d+[\.\)\:]\s+/.test(lowerLine)) return true;

    // Time indicators
    if (/\d+\s*(minute|hour|second|min|hr|sec)s?/.test(lowerLine)) return true;

    // Temperature indicators
    if (/\d+\s*(degree|°|fahrenheit|celsius|f|c)\b/.test(lowerLine))
      return true;

    // Markdown headers (recipe sections)
    if (/^#{1,6}\s+/.test(originalLine)) return true;

    // Bullet points or dashes (ingredient lists)
    if (/^[\-\*\+•]\s+/.test(originalLine)) return true;

    // Serving information
    if (/serv(e|ing)s?\s*:?\s*\d+/i.test(lowerLine)) return true;

    // Recipe timing
    if (/(prep|cook|total)\s*time\s*:?/i.test(lowerLine)) return true;

    return false;
  });

  console.log(
    `[OptimizedExtractor] Original lines: ${lines.length}, Relevant lines: ${relevantLines.length}`
  );

  // Use generous content preservation
  if (relevantLines.length > 3) {
    const relevantContent = relevantLines.join("\n");
    console.log(
      `[OptimizedExtractor] Using relevant content: ${relevantContent.length} chars`
    );
    return relevantContent.substring(0, 10000); // Increased from 8000
  }

  console.log(
    `[OptimizedExtractor] Using fallback content: ${fullText.length} chars`
  );
  return fullText.substring(0, 8000); // Increased from 6000
}

// Optimized API call with better error handling
async function callOptimizedDeepSeekAPI(prompt: string): Promise<any> {
  console.log(
    `[OptimizedExtractor] Calling API with ${prompt.length} character prompt`
  );

  const controller = new AbortController();
  const timeout = 45000; // 45 second timeout

  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Request timed out after ${timeout}ms`));
  }, timeout);

  try {
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
        max_tokens: 4096, // Increased for complete responses
      }),
      signal: controller.signal,
    });

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
    console.log(`[OptimizedExtractor] API call successful`);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[OptimizedExtractor] API call failed:`, error);
    throw error;
  }
}

// Enhanced prompt for better recipe extraction
function createOptimizedPrompt(content: string): string {
  return `You are a professional chef and recipe developer. Analyze this recipe content and extract comprehensive recipe information. Return ONLY valid JSON with complete, detailed recipe data:

${content}

CRITICAL: Return ONLY a valid JSON object in exactly this format. Do not include any explanations, comments, or additional text before or after the JSON:

{
  "title": "ACTUAL_RECIPE_TITLE_HERE",
  "description": "2-3 sentence description highlighting key flavors and appeal",
  "ingredients": [
    {
      "amount": 2,
      "unit": "cups",
      "name": "all-purpose flour"
    },
    {
      "amount": 1,
      "unit": "tsp",
      "name": "salt"
    }
  ],
  "instructions": [
    "Step 1 instruction text",
    "Step 2 instruction text"
  ],
  "prep_time": 15,
  "cook_time": 30,
  "servings": 4,
  "tags": [
    "Cuisine Type",
    "Main Ingredient",
    "Cooking Method",
    "Meal Type"
  ],
  "difficulty": "Easy",
  "cuisine": "Cuisine Name",
  "meal_type": "Meal Type"
}

ENHANCED EXTRACTION RULES:

INGREDIENTS:
- Extract ALL ingredients mentioned, including small amounts like salt, pepper, oil
- Each ingredient MUST have: amount (number), unit (string), name (string)
- Preserve exact quantities and units from the original text
- Include preparation notes in ingredient names (e.g., "large onion, diced")
- Use empty string "" for unit if no unit is specified
- Amount must always be a number (use 1 if no amount specified)

INSTRUCTIONS:
- Break down into clear, sequential steps (aim for 6-15 steps)
- Include specific temperatures, timing, and visual cues
- Mention equipment needed and technique explanations
- Use active voice and clear, concise language
- Each instruction must be a complete string

TAGS (Generate 6-10 relevant tags):
- CUISINE: Italian, Mexican, Asian, Mediterranean, American, etc.
- PROTEIN: Chicken, Beef, Pork, Fish, Vegetarian, etc.
- METHOD: Baked, Grilled, Fried, One Pot, Slow Cooked, etc.
- DIFFICULTY: Easy, Quick, 30 Minute, Beginner, etc.
- MEAL TYPE: Breakfast, Lunch, Dinner, Snack, Dessert, etc.
- CHARACTERISTICS: Healthy, Comfort Food, Spicy, Creamy, etc.

QUALITY REQUIREMENTS:
- Ingredients list must have at least 5 items with specific quantities
- Instructions must have at least 6 detailed steps
- Title must be descriptive and specific
- Description must highlight what makes this recipe special
- Times must be realistic (prep: 5-60 min, cook: 5-180 min)
- Servings must be reasonable (1-12 people)

RETURN ONLY THE JSON OBJECT - NO OTHER TEXT`;
}

// Enhanced JSON parsing with better error recovery
function parseOptimizedResponse(content: string): any {
  console.log(
    `[OptimizedExtractor] Parsing response (${content.length} chars)`
  );

  // Extract JSON from response
  let jsonString = content.trim();

  // Try to find JSON in code blocks first
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonString = codeBlockMatch[1].trim();
    console.log(`[OptimizedExtractor] Extracted from code block`);
  } else {
    // Try to find JSON object
    const objectMatch = content.match(/{[\s\S]*}/);
    if (objectMatch) {
      jsonString = objectMatch[0];
      console.log(`[OptimizedExtractor] Extracted JSON object from content`);
    }
  }

  // Enhanced cleanup
  jsonString = jsonString
    .replace(/,\s*}/g, "}") // Remove trailing commas in objects
    .replace(/,\s*]/g, "]") // Remove trailing commas in arrays
    .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
    .replace(/[\u2018\u2019]/g, "'") // Replace smart apostrophes
    .replace(/\n\s*\n/g, "\n") // Remove extra newlines
    .replace(/\t/g, " ") // Replace tabs with spaces
    .trim();

  // Validate JSON structure
  if (!jsonString.startsWith("{") || !jsonString.endsWith("}")) {
    throw new Error("Invalid JSON structure detected");
  }

  try {
    const parsed = JSON.parse(jsonString);
    console.log(
      `[OptimizedExtractor] Successfully parsed JSON with keys:`,
      Object.keys(parsed)
    );
    return parsed;
  } catch (error) {
    console.error(`[OptimizedExtractor] JSON parsing failed:`, error);
    console.error(
      `[OptimizedExtractor] Problematic JSON:`,
      jsonString.substring(0, 500)
    );
    throw new Error(
      `Failed to parse recipe JSON: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// Transform parsed data to Recipe format
function transformToRecipe(parsedData: any): Partial<Recipe> {
  console.log(`[OptimizedExtractor] Transforming parsed data to Recipe format`);

  // Process ingredients
  const ingredients = (parsedData.ingredients || []).map(
    (ing: any, index: number) => ({
      id: `temp-${index}`,
      name: String(ing.name || "Unknown ingredient"),
      amount: Number(ing.amount) || 1,
      unit: String(ing.unit || ""),
    })
  );

  // Process instructions
  const instructions = (parsedData.instructions || []).map(
    (inst: any, index: number) => {
      const instruction = String(inst);
      // Add numbering if not already present
      if (!/^\d+\./.test(instruction)) {
        return `${index + 1}. ${instruction}`;
      }
      return instruction;
    }
  );

  // Process tags
  const tags = (parsedData.tags || []).filter(
    (tag: any) => typeof tag === "string" && tag.length > 1 && tag.length < 50
  );

  const result: Partial<Recipe> = {
    title: String(parsedData.title || "Untitled Recipe"),
    description: String(parsedData.description || ""),
    prepTime: Number(parsedData.prep_time) || 0,
    cookTime: Number(parsedData.cook_time) || 0,
    servings: Number(parsedData.servings) || 4,
    ingredients,
    instructions,
    tags,
  };

  console.log(`[OptimizedExtractor] Transformation complete:`, {
    title: result.title,
    ingredientCount: result.ingredients?.length || 0,
    instructionCount: result.instructions?.length || 0,
    tagCount: result.tags?.length || 0,
  });

  return result;
}

// Quality validation
function validateRecipeQuality(recipe: Partial<Recipe>): {
  score: number;
  issues: string[];
  isValid: boolean;
} {
  const issues: string[] = [];
  let score = 100;

  // Title validation
  if (
    !recipe.title ||
    recipe.title === "Untitled Recipe" ||
    recipe.title.length < 5
  ) {
    issues.push("Title missing or too short");
    score -= 20;
  }

  // Ingredients validation
  if (!recipe.ingredients || recipe.ingredients.length < 3) {
    issues.push("Insufficient ingredients (minimum 3 required)");
    score -= 30;
  } else if (recipe.ingredients.length < 5) {
    issues.push("Few ingredients (less than 5)");
    score -= 15;
  }

  // Instructions validation
  if (!recipe.instructions || recipe.instructions.length < 3) {
    issues.push("Insufficient instructions (minimum 3 required)");
    score -= 30;
  } else if (recipe.instructions.length < 5) {
    issues.push("Few instructions (less than 5)");
    score -= 15;
  }

  // Tags validation
  if (!recipe.tags || recipe.tags.length < 3) {
    issues.push("Insufficient tags (minimum 3 recommended)");
    score -= 10;
  }

  // Time validation
  if (
    !recipe.prepTime ||
    !recipe.cookTime ||
    recipe.prepTime < 1 ||
    recipe.cookTime < 1
  ) {
    issues.push("Missing or invalid cooking times");
    score -= 10;
  }

  // Description validation
  if (!recipe.description || recipe.description.length < 20) {
    issues.push("Description missing or too short");
    score -= 10;
  }

  const isValid = score >= 70; // Lower threshold for acceptance

  console.log(
    `[OptimizedExtractor] Quality validation - Score: ${score}/100, Issues: ${issues.length}, Valid: ${isValid}`
  );

  return { score, issues, isValid };
}

// Main optimized extraction function
export async function extractRecipeFromTextOptimized(
  recipeText: string
): Promise<Partial<Recipe>> {
  console.log(
    `[OptimizedExtractor] Starting extraction for ${recipeText.length} character text`
  );

  try {
    // Step 1: Smart truncation with natural boundaries
    const MAX_LENGTH = 25000; // Increased limit
    let processedText = recipeText;

    if (recipeText.length > MAX_LENGTH) {
      console.log(
        `[OptimizedExtractor] Text too long (${recipeText.length} chars), truncating to ${MAX_LENGTH} chars`
      );
      const truncatedText = recipeText.substring(0, MAX_LENGTH);
      const lastParagraph = truncatedText.lastIndexOf("\n\n");
      const lastSentence = truncatedText.lastIndexOf(".");

      if (lastParagraph > MAX_LENGTH * 0.8) {
        processedText = truncatedText.substring(0, lastParagraph);
      } else if (lastSentence > MAX_LENGTH * 0.8) {
        processedText = truncatedText.substring(0, lastSentence + 1);
      } else {
        processedText = truncatedText;
      }
      console.log(
        `[OptimizedExtractor] Truncated to ${processedText.length} chars`
      );
    }

    // Step 2: Extract relevant content
    const relevantContent = extractOptimizedRecipeContent(processedText);

    // Step 3: Create optimized prompt
    const prompt = createOptimizedPrompt(relevantContent);

    // Step 4: Call API
    const response = await callOptimizedDeepSeekAPI(prompt);

    // Step 5: Parse response
    const content = response.choices[0]?.message?.content || "";
    const parsedData = parseOptimizedResponse(content);

    // Step 6: Transform to Recipe format
    const recipe = transformToRecipe(parsedData);

    // Step 7: Validate quality
    const quality = validateRecipeQuality(recipe);

    if (!quality.isValid) {
      console.warn(
        `[OptimizedExtractor] Recipe quality below threshold:`,
        quality.issues
      );
      // Still return the recipe but log the issues
    }

    console.log(`[OptimizedExtractor] Extraction completed successfully`);
    return recipe;
  } catch (error) {
    console.error(`[OptimizedExtractor] Extraction failed:`, error);
    throw new Error(
      `Failed to extract recipe: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// Test function for the optimized extractor
export async function testOptimizedExtractor(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  const testText = `
Easy Chicken Ramen Recipe

This is a delicious homemade chicken ramen recipe that's perfect for cold days.

Ingredients:
- 4 cups chicken broth
- 2 packs ramen noodles
- 1 chicken breast, sliced
- 2 eggs
- 1 green onion, chopped
- 1 tbsp soy sauce
- 1 tsp sesame oil
- 1 clove garlic, minced
- 1 tsp ginger, grated
- Salt and pepper to taste

Instructions:
1. Heat the chicken broth in a large pot over medium heat.
2. Add the garlic and ginger, simmer for 2 minutes.
3. Add the chicken slices and cook for 5 minutes.
4. Add the ramen noodles and cook according to package directions.
5. In the last minute, crack the eggs into the broth.
6. Season with soy sauce, sesame oil, salt, and pepper.
7. Serve hot, garnished with green onions.

Prep time: 10 minutes
Cook time: 15 minutes
Serves: 2 people
  `;

  try {
    const result = await extractRecipeFromTextOptimized(testText);
    const quality = validateRecipeQuality(result);

    return {
      success: quality.isValid,
      message: quality.isValid
        ? "Optimized extractor working correctly"
        : "Optimized extractor needs improvement",
      details: {
        title: result.title,
        ingredientCount: result.ingredients?.length || 0,
        instructionCount: result.instructions?.length || 0,
        tagCount: result.tags?.length || 0,
        qualityScore: quality.score,
        issues: quality.issues,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Test failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

// Console test function for debugging in the app
export async function testOptimizedExtractorInApp(
  testText?: string
): Promise<void> {
  const defaultTestText = `
Easy Chicken Ramen Recipe

This is a delicious homemade chicken ramen recipe that's perfect for cold days.

Ingredients:
- 4 cups chicken broth
- 2 packs ramen noodles
- 1 chicken breast, sliced
- 2 eggs
- 1 green onion, chopped
- 1 tbsp soy sauce
- 1 tsp sesame oil
- 1 clove garlic, minced
- 1 tsp ginger, grated
- Salt and pepper to taste

Instructions:
1. Heat the chicken broth in a large pot over medium heat.
2. Add the garlic and ginger, simmer for 2 minutes.
3. Add the chicken slices and cook for 5 minutes.
4. Add the ramen noodles and cook according to package directions.
5. In the last minute, crack the eggs into the broth.
6. Season with soy sauce, sesame oil, salt, and pepper.
7. Serve hot, garnished with green onions.

Prep time: 10 minutes
Cook time: 15 minutes
Serves: 2 people
  `;

  const textToTest = testText || defaultTestText;

  console.log("🧪 [OptimizedExtractor] Starting console test...");
  console.log(
    `📝 [OptimizedExtractor] Testing with ${textToTest.length} character text`
  );

  try {
    const startTime = Date.now();
    const result = await extractRecipeFromTextOptimized(textToTest);
    const processingTime = Date.now() - startTime;

    const quality = validateRecipeQuality(result);

    console.log("✅ [OptimizedExtractor] Test completed successfully!");
    console.log(
      `⏱️  [OptimizedExtractor] Processing time: ${processingTime}ms`
    );
    console.log(`📊 [OptimizedExtractor] Quality score: ${quality.score}/100`);
    console.log(
      `🎯 [OptimizedExtractor] High quality: ${quality.isValid ? "YES" : "NO"}`
    );
    console.log("📋 [OptimizedExtractor] Extracted recipe:", {
      title: result.title,
      ingredientCount: result.ingredients?.length || 0,
      instructionCount: result.instructions?.length || 0,
      tagCount: result.tags?.length || 0,
      prepTime: result.prepTime,
      cookTime: result.cookTime,
      servings: result.servings,
    });

    if (quality.issues.length > 0) {
      console.log("⚠️  [OptimizedExtractor] Quality issues:", quality.issues);
    }
  } catch (error) {
    console.error("❌ [OptimizedExtractor] Test failed:", error);
  }
}

// Make it available globally for console testing
if (typeof global !== "undefined") {
  (global as any).testOptimizedExtractor = testOptimizedExtractorInApp;
}
