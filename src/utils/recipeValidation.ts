import { Recipe, Ingredient } from "@/types";

export interface ValidationErrors {
  [key: string]: string;
}

// Validation constraints
export const VALIDATION_LIMITS = {
  TITLE: { min: 3, max: 100 },
  DESCRIPTION: { min: 0, max: 500 },
  INGREDIENTS: { min: 1, max: 50 },
  INGREDIENT_NAME: { min: 1, max: 200 },
  INSTRUCTIONS: { min: 1, max: 30 },
  INSTRUCTION_TEXT: { min: 1, max: 1000 },
  PREP_TIME: { min: 0, max: 1440 }, // 24 hours in minutes
  COOK_TIME: { min: 0, max: 1440 },
  SERVINGS: { min: 1, max: 100 },
  TAGS: { min: 0, max: 20 },
  TAG_LENGTH: { min: 1, max: 30 },
};

/**
 * Validates a recipe and returns validation errors
 */
export function validateRecipe(recipe: Recipe): ValidationErrors {
  const errors: ValidationErrors = {};

  // Validate title
  if (!recipe.title?.trim()) {
    errors.title = "Title is required";
  } else if (recipe.title.trim().length < VALIDATION_LIMITS.TITLE.min) {
    errors.title = `Title must be at least ${VALIDATION_LIMITS.TITLE.min} characters`;
  } else if (recipe.title.length > VALIDATION_LIMITS.TITLE.max) {
    errors.title = `Title must be less than ${VALIDATION_LIMITS.TITLE.max} characters`;
  }

  // Validate description
  if (
    recipe.description &&
    recipe.description.length > VALIDATION_LIMITS.DESCRIPTION.max
  ) {
    errors.description = `Description must be less than ${VALIDATION_LIMITS.DESCRIPTION.max} characters`;
  }

  // Validate ingredients
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    errors.ingredients = "At least one ingredient is required";
  } else if (recipe.ingredients.length > VALIDATION_LIMITS.INGREDIENTS.max) {
    errors.ingredients = `Maximum ${VALIDATION_LIMITS.INGREDIENTS.max} ingredients allowed`;
  } else {
    // Validate individual ingredients
    const ingredientErrors = validateIngredients(recipe.ingredients);
    if (ingredientErrors.length > 0) {
      errors.ingredients = ingredientErrors.join(", ");
    }
  }

  // Validate instructions
  if (!recipe.instructions || recipe.instructions.length === 0) {
    errors.instructions = "At least one instruction is required";
  } else if (recipe.instructions.length > VALIDATION_LIMITS.INSTRUCTIONS.max) {
    errors.instructions = `Maximum ${VALIDATION_LIMITS.INSTRUCTIONS.max} instructions allowed`;
  } else {
    // Validate individual instructions
    const instructionErrors = validateInstructions(recipe.instructions);
    if (instructionErrors.length > 0) {
      errors.instructions = instructionErrors.join(", ");
    }
  }

  // Validate prep time
  if (
    recipe.prepTime < VALIDATION_LIMITS.PREP_TIME.min ||
    recipe.prepTime > VALIDATION_LIMITS.PREP_TIME.max
  ) {
    errors.prepTime = `Prep time must be between ${VALIDATION_LIMITS.PREP_TIME.min} and ${VALIDATION_LIMITS.PREP_TIME.max} minutes`;
  }

  // Validate cook time
  if (
    recipe.cookTime < VALIDATION_LIMITS.COOK_TIME.min ||
    recipe.cookTime > VALIDATION_LIMITS.COOK_TIME.max
  ) {
    errors.cookTime = `Cook time must be between ${VALIDATION_LIMITS.COOK_TIME.min} and ${VALIDATION_LIMITS.COOK_TIME.max} minutes`;
  }

  // Validate servings
  if (
    recipe.servings < VALIDATION_LIMITS.SERVINGS.min ||
    recipe.servings > VALIDATION_LIMITS.SERVINGS.max
  ) {
    errors.servings = `Servings must be between ${VALIDATION_LIMITS.SERVINGS.min} and ${VALIDATION_LIMITS.SERVINGS.max}`;
  }

  // Validate tags
  if (recipe.tags && recipe.tags.length > VALIDATION_LIMITS.TAGS.max) {
    errors.tags = `Maximum ${VALIDATION_LIMITS.TAGS.max} tags allowed`;
  } else if (recipe.tags) {
    const tagErrors = validateTags(recipe.tags);
    if (tagErrors.length > 0) {
      errors.tags = tagErrors.join(", ");
    }
  }

  return errors;
}

/**
 * Validates individual ingredients
 */
function validateIngredients(ingredients: Ingredient[]): string[] {
  const errors: string[] = [];

  ingredients.forEach((ingredient, index) => {
    if (!ingredient.name?.trim()) {
      errors.push(`Ingredient ${index + 1}: Name is required`);
    } else if (ingredient.name.length > VALIDATION_LIMITS.INGREDIENT_NAME.max) {
      errors.push(`Ingredient ${index + 1}: Name too long`);
    }

    if (ingredient.amount <= 0) {
      errors.push(`Ingredient ${index + 1}: Amount must be greater than 0`);
    }

    if (ingredient.amount > 9999) {
      errors.push(`Ingredient ${index + 1}: Amount too large`);
    }
  });

  return errors;
}

/**
 * Validates individual instructions
 */
function validateInstructions(instructions: string[]): string[] {
  const errors: string[] = [];

  instructions.forEach((instruction, index) => {
    if (!instruction?.trim()) {
      errors.push(`Step ${index + 1}: Instruction cannot be empty`);
    } else if (instruction.length > VALIDATION_LIMITS.INSTRUCTION_TEXT.max) {
      errors.push(`Step ${index + 1}: Instruction too long`);
    }
  });

  return errors;
}

/**
 * Validates tags
 */
function validateTags(tags: string[]): string[] {
  const errors: string[] = [];

  tags.forEach((tag, index) => {
    if (!tag?.trim()) {
      errors.push(`Tag ${index + 1}: Cannot be empty`);
    } else if (tag.length > VALIDATION_LIMITS.TAG_LENGTH.max) {
      errors.push(`Tag ${index + 1}: Too long`);
    }
  });

  // Check for duplicate tags
  const uniqueTags = new Set(tags.map((tag) => tag.toLowerCase().trim()));
  if (uniqueTags.size !== tags.length) {
    errors.push("Duplicate tags are not allowed");
  }

  return errors;
}

/**
 * Validates a single field and returns error message if any
 */
export function validateField(
  fieldName: keyof Recipe,
  value: any,
  recipe?: Recipe
): string | null {
  switch (fieldName) {
    case "title":
      if (!value?.trim()) return "Title is required";
      if (value.trim().length < VALIDATION_LIMITS.TITLE.min) {
        return `Title must be at least ${VALIDATION_LIMITS.TITLE.min} characters`;
      }
      if (value.length > VALIDATION_LIMITS.TITLE.max) {
        return `Title must be less than ${VALIDATION_LIMITS.TITLE.max} characters`;
      }
      break;

    case "description":
      if (value && value.length > VALIDATION_LIMITS.DESCRIPTION.max) {
        return `Description must be less than ${VALIDATION_LIMITS.DESCRIPTION.max} characters`;
      }
      break;

    case "prepTime":
    case "cookTime":
      if (value < 0 || value > VALIDATION_LIMITS.PREP_TIME.max) {
        return `Time must be between 0 and ${VALIDATION_LIMITS.PREP_TIME.max} minutes`;
      }
      break;

    case "servings":
      if (
        value < VALIDATION_LIMITS.SERVINGS.min ||
        value > VALIDATION_LIMITS.SERVINGS.max
      ) {
        return `Servings must be between ${VALIDATION_LIMITS.SERVINGS.min} and ${VALIDATION_LIMITS.SERVINGS.max}`;
      }
      break;

    default:
      break;
  }

  return null;
}

/**
 * Checks if a recipe has any validation errors
 */
export function isRecipeValid(recipe: Recipe): boolean {
  const errors = validateRecipe(recipe);
  return Object.keys(errors).length === 0;
}

/**
 * Gets character count for text fields with limits
 */
export function getCharacterCount(
  text: string,
  limit: number
): { count: number; remaining: number; isOverLimit: boolean } {
  const count = text?.length || 0;
  const remaining = limit - count;
  const isOverLimit = count > limit;

  return { count, remaining, isOverLimit };
}

/**
 * Sanitizes input text by trimming and removing excessive whitespace
 */
export function sanitizeText(text: string): string {
  return text?.trim().replace(/\s+/g, " ") || "";
}

/**
 * Validates ingredient amount input
 */
export function validateIngredientAmount(amount: string): {
  isValid: boolean;
  numericValue: number;
  error?: string;
} {
  const trimmed = amount.trim();

  if (!trimmed) {
    return { isValid: false, numericValue: 0, error: "Amount is required" };
  }

  // Handle fractions like "1/2", "1 1/2"
  const fractionMatch = trimmed.match(/^(\d+)?\s*(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const whole = parseInt(fractionMatch[1] || "0");
    const numerator = parseInt(fractionMatch[2]);
    const denominator = parseInt(fractionMatch[3]);

    if (denominator === 0) {
      return { isValid: false, numericValue: 0, error: "Invalid fraction" };
    }

    const numericValue = whole + numerator / denominator;
    return { isValid: true, numericValue };
  }

  // Handle decimal numbers
  const numericValue = parseFloat(trimmed);
  if (isNaN(numericValue)) {
    return { isValid: false, numericValue: 0, error: "Must be a valid number" };
  }

  if (numericValue <= 0) {
    return {
      isValid: false,
      numericValue: 0,
      error: "Amount must be greater than 0",
    };
  }

  if (numericValue > 9999) {
    return { isValid: false, numericValue: 0, error: "Amount too large" };
  }

  return { isValid: true, numericValue };
}

/**
 * Validates a recipe for editing with more relaxed rules
 * Still maintains security measures but allows more flexibility
 */
export function validateRecipeForEdit(recipe: Recipe): ValidationErrors {
  const errors: ValidationErrors = {};

  // Validate title - still required but more lenient
  if (!recipe.title?.trim()) {
    errors.title = "Title is required";
  } else if (recipe.title.length > VALIDATION_LIMITS.TITLE.max) {
    errors.title = `Title must be less than ${VALIDATION_LIMITS.TITLE.max} characters`;
  }

  // Validate description - only check max length for security
  if (
    recipe.description &&
    recipe.description.length > VALIDATION_LIMITS.DESCRIPTION.max
  ) {
    errors.description = `Description must be less than ${VALIDATION_LIMITS.DESCRIPTION.max} characters`;
  }

  // Validate ingredients - more relaxed, allow empty ingredients during editing
  if (
    recipe.ingredients &&
    recipe.ingredients.length > VALIDATION_LIMITS.INGREDIENTS.max
  ) {
    errors.ingredients = `Maximum ${VALIDATION_LIMITS.INGREDIENTS.max} ingredients allowed`;
  } else if (recipe.ingredients) {
    // Only validate for security issues, not completeness
    const ingredientErrors = validateIngredientsForEdit(recipe.ingredients);
    if (ingredientErrors.length > 0) {
      errors.ingredients = ingredientErrors.join(", ");
    }
  }

  // Validate instructions - more relaxed, allow empty instructions during editing
  if (
    recipe.instructions &&
    recipe.instructions.length > VALIDATION_LIMITS.INSTRUCTIONS.max
  ) {
    errors.instructions = `Maximum ${VALIDATION_LIMITS.INSTRUCTIONS.max} instructions allowed`;
  } else if (recipe.instructions) {
    // Only validate for security issues, not completeness
    const instructionErrors = validateInstructionsForEdit(recipe.instructions);
    if (instructionErrors.length > 0) {
      errors.instructions = instructionErrors.join(", ");
    }
  }

  // Validate times - allow 0 values during editing
  if (recipe.prepTime > VALIDATION_LIMITS.PREP_TIME.max) {
    errors.prepTime = `Prep time must be less than ${VALIDATION_LIMITS.PREP_TIME.max} minutes`;
  }

  if (recipe.cookTime > VALIDATION_LIMITS.COOK_TIME.max) {
    errors.cookTime = `Cook time must be less than ${VALIDATION_LIMITS.COOK_TIME.max} minutes`;
  }

  // Validate servings - allow 0 during editing
  if (recipe.servings > VALIDATION_LIMITS.SERVINGS.max) {
    errors.servings = `Servings must be less than ${VALIDATION_LIMITS.SERVINGS.max}`;
  }

  // Validate tags - only check max count and length for security
  if (recipe.tags && recipe.tags.length > VALIDATION_LIMITS.TAGS.max) {
    errors.tags = `Maximum ${VALIDATION_LIMITS.TAGS.max} tags allowed`;
  } else if (recipe.tags) {
    const tagErrors = validateTagsForEdit(recipe.tags);
    if (tagErrors.length > 0) {
      errors.tags = tagErrors.join(", ");
    }
  }

  return errors;
}

/**
 * Validates individual ingredients for editing (more relaxed)
 */
function validateIngredientsForEdit(ingredients: Ingredient[]): string[] {
  const errors: string[] = [];

  ingredients.forEach((ingredient, index) => {
    // Only check for security issues, not completeness
    if (
      ingredient.name &&
      ingredient.name.length > VALIDATION_LIMITS.INGREDIENT_NAME.max
    ) {
      errors.push(`Ingredient ${index + 1}: Name too long`);
    }

    // Allow 0 amounts during editing, but check for reasonable upper bounds
    if (ingredient.amount > 99999) {
      errors.push(`Ingredient ${index + 1}: Amount too large`);
    }
  });

  return errors;
}

/**
 * Validates individual instructions for editing (more relaxed)
 */
function validateInstructionsForEdit(instructions: string[]): string[] {
  const errors: string[] = [];

  instructions.forEach((instruction, index) => {
    // Only check for security issues, not completeness
    if (
      instruction &&
      instruction.length > VALIDATION_LIMITS.INSTRUCTION_TEXT.max
    ) {
      errors.push(`Step ${index + 1}: Instruction too long`);
    }
  });

  return errors;
}

/**
 * Validates tags for editing (more relaxed)
 */
function validateTagsForEdit(tags: string[]): string[] {
  const errors: string[] = [];

  tags.forEach((tag, index) => {
    // Only check for security issues, not completeness
    if (tag && tag.length > VALIDATION_LIMITS.TAG_LENGTH.max) {
      errors.push(`Tag ${index + 1}: Too long`);
    }
  });

  return errors;
}
