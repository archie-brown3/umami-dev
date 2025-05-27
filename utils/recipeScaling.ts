import { Ingredient } from "../types";

/**
 * Scale a single ingredient quantity based on serving size change
 */
export function scaleIngredientAmount(
  originalAmount: number,
  originalServings: number,
  newServings: number
): number {
  if (originalServings <= 0) return originalAmount;

  const scalingFactor = newServings / originalServings;
  const scaledAmount = originalAmount * scalingFactor;

  // Round to reasonable precision (2 decimal places)
  return Math.round(scaledAmount * 100) / 100;
}

/**
 * Scale all ingredients in a recipe based on serving size change
 */
export function scaleRecipeIngredients(
  ingredients: Ingredient[],
  originalServings: number,
  newServings: number
): Ingredient[] {
  return ingredients.map((ingredient) => ({
    ...ingredient,
    amount: scaleIngredientAmount(
      ingredient.amount,
      originalServings,
      newServings
    ),
  }));
}

/**
 * Format scaled amount for display (handles fractions and decimals nicely)
 */
export function formatScaledAmount(amount: number): string {
  // Handle very small amounts
  if (amount < 0.01) {
    return "pinch";
  }

  // Handle common fractions
  const fractions: { [key: string]: string } = {
    "0.125": "1/8",
    "0.25": "1/4",
    "0.33": "1/3",
    "0.5": "1/2",
    "0.67": "2/3",
    "0.75": "3/4",
  };

  // Check if the amount is close to a common fraction
  const roundedAmount = Math.round(amount * 100) / 100;
  const fractionKey = roundedAmount.toString();

  if (fractions[fractionKey]) {
    return fractions[fractionKey];
  }

  // Check for mixed numbers (e.g., 1.5 = 1 1/2)
  const wholeNumber = Math.floor(amount);
  const decimal = amount - wholeNumber;

  if (wholeNumber > 0 && decimal > 0) {
    const decimalKey = Math.round(decimal * 100) / 100;
    if (fractions[decimalKey.toString()]) {
      return `${wholeNumber} ${fractions[decimalKey.toString()]}`;
    }
  }

  // For whole numbers, don't show decimals
  if (amount === Math.floor(amount)) {
    return amount.toString();
  }

  // For other decimals, show up to 2 decimal places, removing trailing zeros
  return parseFloat(amount.toFixed(2)).toString();
}

/**
 * Get scaling factor between original and new servings
 */
export function getScalingFactor(
  originalServings: number,
  newServings: number
): number {
  if (originalServings <= 0) return 1;
  return newServings / originalServings;
}

/**
 * Check if a recipe is currently scaled from its original servings
 */
export function isRecipeScaled(
  originalServings: number,
  currentServings: number
): boolean {
  return originalServings !== currentServings;
}
