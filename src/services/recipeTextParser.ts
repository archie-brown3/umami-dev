import { Recipe, Ingredient } from "@/types";

// Enhanced Recipe Text Parser
// Converts OCR-extracted text into structured recipe data
export class RecipeTextParser {
  private nutritionLabels = [
    "energy",
    "fat",
    "sat fat",
    "protein",
    "carbs",
    "sugars",
    "salt",
    "fibre",
  ];
  private nutritionValuePattern = /^\d+(?:\.\d+)?[a-zA-Z]*$/;

  /**
   * Parse OCR text into structured recipe data
   */
  public parseRecipeText(text: string): Partial<Recipe> {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const recipe: Partial<Recipe> = {
      title: "",
      description: "",
      servings: undefined,
      prepTime: undefined,
      cookTime: undefined,
      ingredients: [],
      instructions: [],
      tags: [],
      category: "",
    };

    // Find section boundaries
    const sections = this.identifySections(lines);

    // Parse each section
    this.parseHeader(lines.slice(0, sections.ingredientsStart), recipe);
    this.parseIngredients(
      lines.slice(sections.ingredientsStart, sections.instructionsStart),
      recipe
    );
    this.parseInstructions(
      lines.slice(sections.instructionsStart, sections.nutritionStart),
      recipe
    );

    // Generate tags based on content
    recipe.tags = this.generateTags(recipe);

    // Add metadata
    recipe.createdAt = new Date().toISOString();
    recipe.updatedAt = new Date().toISOString();
    recipe.sourceUrl = "photo-extraction";

    return recipe;
  }

  private identifySections(lines: string[]) {
    let ingredientsStart = -1;
    let instructionsStart = -1;
    let nutritionStart = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Find ingredients section (starts with quantities)
      if (ingredientsStart === -1 && this.isIngredientLine(line)) {
        ingredientsStart = i;
      }

      // Find instructions section (long sentences with cooking verbs)
      if (
        ingredientsStart !== -1 &&
        instructionsStart === -1 &&
        line.length > 50 &&
        this.containsInstructionWords(line)
      ) {
        instructionsStart = i;
      }

      // Find nutrition section
      if (
        instructionsStart !== -1 &&
        nutritionStart === -1 &&
        this.isNutritionLabel(line)
      ) {
        nutritionStart = i;
      }
    }

    return {
      ingredientsStart: ingredientsStart === -1 ? 4 : ingredientsStart, // Default after header
      instructionsStart:
        instructionsStart === -1 ? lines.length : instructionsStart,
      nutritionStart: nutritionStart === -1 ? lines.length : nutritionStart,
    };
  }

  private parseHeader(headerLines: string[], recipe: Partial<Recipe>) {
    for (let i = 0; i < headerLines.length; i++) {
      const line = headerLines[i];
      const lowerLine = line.toLowerCase();

      if (
        i === 0 &&
        (lowerLine.includes("pan") ||
          lowerLine.includes("pot") ||
          lowerLine.includes("oven"))
      ) {
        recipe.category = line;
      } else if (i === 1) {
        recipe.title = this.formatTitle(line);
      } else if (i === 2) {
        recipe.description = line;
      } else if (
        lowerLine.includes("serves") &&
        lowerLine.includes("minutes")
      ) {
        const servingMatch = line.match(/serves\s+(\d+)/i);
        const timeMatch = line.match(/total\s+(\d+)\s+minutes/i);

        if (servingMatch) recipe.servings = parseInt(servingMatch[1]);
        if (timeMatch) {
          // Set both prep and cook time to half of total time as an estimate
          const totalTime = parseInt(timeMatch[1]);
          recipe.prepTime = Math.floor(totalTime / 2);
          recipe.cookTime = Math.ceil(totalTime / 2);
        }
      }
    }
  }

  private parseIngredients(ingredientLines: string[], recipe: Partial<Recipe>) {
    const ingredients: Ingredient[] = [];

    for (const line of ingredientLines) {
      if (this.isIngredientLine(line) && !this.isNutritionValue(line)) {
        const ingredient = this.parseIngredient(line);
        if (ingredient && ingredient.name.length > 1) {
          // Filter out single characters
          ingredients.push({
            id: `parsed-${ingredients.length}`,
            ...ingredient,
          });
        }
      }
    }

    recipe.ingredients = ingredients;
  }

  private parseInstructions(
    instructionLines: string[],
    recipe: Partial<Recipe>
  ) {
    let instructionText = "";

    for (const line of instructionLines) {
      if (line.length > 30 && this.containsInstructionWords(line)) {
        instructionText += line + " ";
      }
    }

    if (instructionText.trim()) {
      recipe.instructions = this.splitInstructions([instructionText.trim()]);
    }
  }

  private formatTitle(title: string): string {
    return title
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private isIngredientLine(line: string): boolean {
    const lowerLine = line.toLowerCase();

    // Skip nutrition values
    if (this.isNutritionValue(line)) return false;

    // Check for quantity patterns
    if (/^\d+/.test(line)) return true;

    // Check for common ingredient words but exclude nutrition labels
    const ingredientWords = [
      "cloves",
      "piece",
      "sticks",
      "nests",
      "packet",
      "sauce",
      "limes",
      "cups",
      "tbsp",
      "tsp",
    ];
    const hasIngredientWord = ingredientWords.some((word) =>
      lowerLine.includes(word)
    );
    const isNutritionLabel = this.nutritionLabels.some((label) =>
      lowerLine.includes(label)
    );

    return hasIngredientWord && !isNutritionLabel;
  }

  private isNutritionValue(line: string): boolean {
    // Check if it's a standalone nutrition value (like "4.6g", "577kcal")
    return this.nutritionValuePattern.test(line.trim());
  }

  private isNutritionLabel(line: string): boolean {
    return this.nutritionLabels.some((label) =>
      line.toLowerCase().includes(label)
    );
  }

  private parseIngredient(line: string): Omit<Ingredient, "id"> | null {
    const originalLine = line.trim();

    // Handle "x weight" pattern (e.g., "2 x 150g skinless chicken breasts")
    if (originalLine.includes(" x ")) {
      const parts = originalLine.split(" x ");
      if (parts.length === 2) {
        const quantity = parts[0].trim();
        const rest = parts[1].trim();
        const weightMatch = rest.match(/^(\d+(?:\.\d+)?[a-zA-Z]+)\s+(.+)$/);

        if (weightMatch) {
          // For complex amounts like "2 x 150g", store as amount 2 and include weight in unit
          const quantityNum = parseFloat(quantity) || 1;
          return {
            name: weightMatch[2].trim(),
            amount: quantityNum,
            unit: `x ${weightMatch[1]}`,
          };
        }
      }
    }

    // Handle standard patterns
    const patterns = [
      // "2 cloves of garlic"
      /^(\d+(?:\.\d+)?)\s+([a-zA-Z]+)\s+of\s+(.+)$/,
      // "6cm piece of ginger"
      /^(\d+(?:\.\d+)?[a-zA-Z]+)\s+(.+)$/,
      // "2 sticks of lemongrass"
      /^(\d+(?:\.\d+)?)\s+([a-zA-Z]+)\s+of\s+(.+)$/,
      // "teriyaki sauce" (no quantity)
      /^([a-zA-Z\s,&]+)$/,
    ];

    for (const pattern of patterns) {
      const match = originalLine.match(pattern);
      if (match) {
        if (match.length === 4) {
          // Pattern with "of" (e.g., "2 cloves of garlic")
          return {
            name: match[3].trim(),
            amount: parseFloat(match[1]),
            unit: match[2],
          };
        } else if (match.length === 3) {
          // Pattern with unit+amount (e.g., "6cm piece of ginger")
          const amountUnit = match[1];
          const amountMatch = amountUnit.match(/^(\d+(?:\.\d+)?)([a-zA-Z]+)$/);
          if (amountMatch) {
            return {
              name: match[2].trim(),
              amount: parseFloat(amountMatch[1]),
              unit: amountMatch[2],
            };
          } else {
            // Just ingredient name
            return {
              name: match[1].trim(),
              amount: 1,
              unit: "item",
            };
          }
        }
      }
    }

    // Fallback: treat as ingredient name only
    return {
      name: originalLine,
      amount: 1,
      unit: "item",
    };
  }

  private containsInstructionWords(line: string): boolean {
    const instructionWords = [
      "boil",
      "peel",
      "cook",
      "place",
      "add",
      "mix",
      "stir",
      "heat",
      "drain",
      "serve",
      "whack",
      "bash",
      "drizzle",
    ];
    const lowerLine = line.toLowerCase();
    return instructionWords.some((word) => lowerLine.includes(word));
  }

  private splitInstructions(instructions: string[]): string[] {
    const steps: string[] = [];

    for (const instruction of instructions) {
      // Split on sentence boundaries
      const sentences = instruction.split(/\.\s+/);
      let currentStep = "";

      for (const sentence of sentences) {
        if (sentence.trim()) {
          currentStep += sentence.trim() + ". ";

          // Create steps based on logical cooking actions
          if (this.isCompleteStep(currentStep) || currentStep.length > 200) {
            steps.push(currentStep.trim());
            currentStep = "";
          }
        }
      }

      // Add any remaining content
      if (currentStep.trim()) {
        steps.push(currentStep.trim());
      }
    }

    return steps.filter((step) => step.length > 10); // Filter out very short steps
  }

  private isCompleteStep(step: string): boolean {
    // A step is complete if it contains a complete cooking action
    const actionWords = [
      "boil",
      "peel",
      "cook",
      "place",
      "heat",
      "drain",
      "serve",
    ];
    const lowerStep = step.toLowerCase();
    return (
      actionWords.some((word) => lowerStep.includes(word)) &&
      step.trim().endsWith(".")
    );
  }

  private generateTags(recipe: Partial<Recipe>): string[] {
    const tags: string[] = [];

    // Add category-based tags
    if (recipe.category && recipe.category.toLowerCase().includes("pan")) {
      tags.push("one-pan", "quick-meals");
    }

    // Add ingredient-based tags
    const ingredientText = (recipe.ingredients || [])
      .map((i) => i.name)
      .join(" ")
      .toLowerCase();

    if (ingredientText.includes("chicken")) tags.push("chicken", "poultry");
    if (ingredientText.includes("noodles")) tags.push("noodles", "asian");
    if (ingredientText.includes("lemongrass"))
      tags.push("asian", "thai", "aromatic");
    if (ingredientText.includes("teriyaki")) tags.push("japanese", "asian");
    if (ingredientText.includes("ginger")) tags.push("asian", "spicy");
    if (ingredientText.includes("lime")) tags.push("citrus", "fresh");
    if (ingredientText.includes("pasta")) tags.push("pasta", "italian");
    if (ingredientText.includes("cheese")) tags.push("cheese", "dairy");
    if (ingredientText.includes("beef")) tags.push("beef", "meat");
    if (ingredientText.includes("fish")) tags.push("fish", "seafood");

    // Add time-based tags based on prep + cook time
    const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
    if (totalTime <= 30) {
      tags.push("quick-meals", "weeknight-dinner");
    }

    // Add serving-based tags
    if (recipe.servings && recipe.servings <= 2) {
      tags.push("small-batch", "date-night");
    }

    return [...new Set(tags)]; // Remove duplicates
  }
}

/**
 * Parse OCR-extracted text into structured recipe data
 * @param text The raw text extracted from OCR
 * @returns Partial recipe object with structured data
 */
export function parseRecipeFromText(text: string): Partial<Recipe> {
  const parser = new RecipeTextParser();
  return parser.parseRecipeText(text);
}

/**
 * Enhanced text extraction with recipe parsing
 * Combines OCR extraction with intelligent recipe parsing
 * @param imageUri The image URI to extract text from
 * @returns Promise with parsed recipe data
 */
export async function extractAndParseRecipeFromImage(
  imageUri: string
): Promise<Partial<Recipe>> {
  // Import the text extraction service
  const { extractTextFromImage } = await import("./textRecognition");

  // Extract raw text from image
  const extractedText = await extractTextFromImage(imageUri);

  if (!extractedText || extractedText.trim().length === 0) {
    throw new Error("No text could be extracted from the image");
  }

  // Parse the extracted text into structured recipe data
  const parsedRecipe = parseRecipeFromText(extractedText);

  // Validate that we have meaningful recipe data
  if (
    !parsedRecipe.title &&
    (!parsedRecipe.ingredients || parsedRecipe.ingredients.length === 0)
  ) {
    throw new Error(
      "Could not identify recipe structure in the extracted text"
    );
  }

  return parsedRecipe;
}
