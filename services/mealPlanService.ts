import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Interfaces matching the database schema
export interface MealPlanItem {
  id: string;
  meal_plan_id: string;
  recipe_id: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  created_at: string;
}

export interface MealPlan {
  id: string;
  user_id: string;
  date: string; // Single date as per database schema
  created_at: string;
  updated_at: string;
  items?: MealPlanItem[];
}

export interface WeekMeals {
  [date: string]: {
    [mealType: string]: MealPlanItem[];
  };
}

// Utility function to retry operations with exponential backoff
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt + 1} failed:`, error);

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
};

// Check if error is network-related
const isNetworkError = (error: any): boolean => {
  const errorMessage = error?.message?.toLowerCase() || "";
  return (
    errorMessage.includes("network") ||
    errorMessage.includes("fetch") ||
    errorMessage.includes("connection") ||
    error?.code === "NETWORK_ERROR"
  );
};

// Offline storage functions
const STORAGE_KEYS = {
  MEAL_PLANS: "mealPlans",
  LAST_SYNC: "mealPlansLastSync",
};

// Simple network connectivity check
const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    const response = await fetch("https://www.google.com/favicon.ico", {
      method: "HEAD",
      cache: "no-cache",
    });
    return response.ok;
  } catch {
    return false;
  }
};

const saveMealPlansToStorage = async (
  userId: string,
  weekStart: string,
  meals: WeekMeals
): Promise<void> => {
  try {
    const key = `${STORAGE_KEYS.MEAL_PLANS}_${userId}_${weekStart}`;
    await AsyncStorage.setItem(
      key,
      JSON.stringify({
        meals,
        timestamp: Date.now(),
      })
    );
    console.log(
      `[MealPlanService] Saved meals to offline storage for week ${weekStart}`
    );
  } catch (error) {
    console.error("Error saving meals to storage:", error);
  }
};

const getMealPlansFromStorage = async (
  userId: string,
  weekStart: string
): Promise<WeekMeals | null> => {
  try {
    const key = `${STORAGE_KEYS.MEAL_PLANS}_${userId}_${weekStart}`;
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      const { meals, timestamp } = JSON.parse(stored);
      // Return cached data if it's less than 24 hours old
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        console.log(
          `[MealPlanService] Retrieved meals from offline storage for week ${weekStart}`
        );
        return meals;
      }
    }
    return null;
  } catch (error) {
    console.error("Error retrieving meals from storage:", error);
    return null;
  }
};

// Utility function to get week dates
export const getWeekDates = (weekStart: Date): string[] => {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates;
};

// Get start of week (Monday)
export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

// Core CRUD operations
export const createMealPlan = async (
  userId: string,
  date: string
): Promise<MealPlan> => {
  try {
    const { data, error } = await supabase
      .from("meal_plans")
      .insert({
        user_id: userId,
        date: date,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating meal plan:", error);
    throw error;
  }
};

export const getMealPlans = async (
  userId: string,
  dateRange?: { start: string; end: string }
): Promise<MealPlan[]> => {
  try {
    return await retryOperation(async () => {
      let query = supabase
        .from("meal_plans")
        .select(
          `
          *,
          meal_plan_items (
            id,
            meal_plan_id,
            recipe_id,
            meal_type,
            created_at
          )
        `
        )
        .eq("user_id", userId);

      if (dateRange) {
        query = query.gte("date", dateRange.start).lte("date", dateRange.end);
      }

      const { data, error } = await query.order("date", { ascending: true });

      if (error) {
        console.error("Supabase error in getMealPlans:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      return data.map((plan) => ({
        ...plan,
        items: plan.meal_plan_items || [],
      }));
    });
  } catch (error) {
    console.error("Error fetching meal plans:", error);

    if (isNetworkError(error)) {
      throw new Error(
        "Network connection failed. Please check your internet connection and try again."
      );
    }

    throw new Error(
      `Failed to load meal plans: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getMealPlansForWeek = async (
  userId: string,
  weekStart: string
): Promise<WeekMeals> => {
  try {
    const weekStartDate = new Date(weekStart);
    const weekDates = getWeekDates(weekStartDate);
    const startDate = weekDates[0];
    const endDate = weekDates[6];

    console.log(
      `[MealPlanService] Fetching meal plans for week: ${startDate} to ${endDate}`
    );

    const mealPlans = await getMealPlans(userId, {
      start: startDate,
      end: endDate,
    });

    console.log(
      `[MealPlanService] Found ${mealPlans.length} meal plans for the week`
    );

    // Initialize week structure
    const weekMeals: WeekMeals = {};
    weekDates.forEach((date) => {
      weekMeals[date] = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      };
    });

    // Populate with actual meal plan items
    mealPlans.forEach((plan) => {
      if (plan.items) {
        plan.items.forEach((item) => {
          if (weekMeals[plan.date] && weekMeals[plan.date][item.meal_type]) {
            weekMeals[plan.date][item.meal_type].push(item);
          }
        });
      }
    });

    // Save to offline storage for future use
    await saveMealPlansToStorage(userId, weekStart, weekMeals);

    console.log(`[MealPlanService] Successfully loaded week meals`);
    return weekMeals;
  } catch (error) {
    console.error("Error fetching week meals:", error);

    if (isNetworkError(error)) {
      // Try to get from offline storage
      console.log(
        `[MealPlanService] Network error, checking offline storage...`
      );
      const cachedMeals = await getMealPlansFromStorage(userId, weekStart);

      if (cachedMeals) {
        console.log(
          `[MealPlanService] Using cached meals from offline storage`
        );
        return cachedMeals;
      }

      throw new Error(
        "Unable to connect to the server and no offline data available. Please check your internet connection and try again."
      );
    }

    throw new Error(
      `Failed to load week meals: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const updateMealPlan = async (
  planId: string,
  updates: Partial<MealPlan>
): Promise<MealPlan> => {
  try {
    const { data, error } = await supabase
      .from("meal_plans")
      .update(updates)
      .eq("id", planId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating meal plan:", error);
    throw error;
  }
};

export const deleteMealPlan = async (planId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("meal_plans")
      .delete()
      .eq("id", planId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting meal plan:", error);
    throw error;
  }
};

export const addMealPlanItem = async (
  userId: string,
  date: string,
  item: Omit<MealPlanItem, "id" | "meal_plan_id" | "created_at">
): Promise<MealPlanItem> => {
  try {
    // First, ensure a meal plan exists for this date
    let mealPlan = await getMealPlans(userId, { start: date, end: date });

    if (mealPlan.length === 0) {
      // Create meal plan for this date
      mealPlan = [await createMealPlan(userId, date)];
    }

    const { data, error } = await supabase
      .from("meal_plan_items")
      .insert({
        meal_plan_id: mealPlan[0].id,
        recipe_id: item.recipe_id,
        meal_type: item.meal_type,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding meal plan item:", error);
    throw error;
  }
};

export const removeMealPlanItem = async (itemId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("meal_plan_items")
      .delete()
      .eq("id", itemId);

    if (error) throw error;
  } catch (error) {
    console.error("Error removing meal plan item:", error);
    throw error;
  }
};

// Utility function to get or create meal plan for a specific date
export const getOrCreateMealPlan = async (
  userId: string,
  date: string
): Promise<MealPlan> => {
  try {
    const existingPlans = await getMealPlans(userId, {
      start: date,
      end: date,
    });

    if (existingPlans.length > 0) {
      return existingPlans[0];
    }

    return await createMealPlan(userId, date);
  } catch (error) {
    console.error("Error getting or creating meal plan:", error);
    throw error;
  }
};
