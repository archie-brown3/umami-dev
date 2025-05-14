export interface Nutrient {
  id: string;
  name: string;
  amount: number;
  unit: string;
}

export interface IngredientDetails {
  id: string;
  name: string;
  nutrients?: Nutrient[];
  // Add other fields as needed
}

export function convertUnitForNutrition(
  amount: number,
  unit: string,
  ingredient: IngredientDetails
): { convertedAmount: number; conversionFactor: number } {
  // Dummy implementation: just return the amount and a factor of 1
  return { convertedAmount: amount, conversionFactor: 1 };
}

export interface NutritionResult {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
  saturated_fat?: number;
  sugar?: number;
  sodium?: number;
  potassium?: number;
  cholesterol?: number;
  vitamin_a?: number;
  vitamin_c?: number;
  calcium?: number;
  iron?: number;
  // Add more fields as needed
}
