export interface MealPlanItem {
  id: string;
  meal_plan_id: string;
  recipe_id: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  created_at: string;
}

export interface WeekMeals {
  [date: string]: {
    [mealType: string]: MealPlanItem[];
  };
}
