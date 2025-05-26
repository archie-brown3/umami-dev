import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
  MealPlan,
  MealPlanItem,
  WeekMeals,
  getMealPlansForWeek,
  addMealPlanItem,
  removeMealPlanItem,
  getWeekStart,
  getWeekDates,
} from "@/services/mealPlanService";
import { generateShoppingListFromMealPlan } from "@/services/groceriesService";

export interface MealSlot {
  date: string;
  mealType: string;
  recipeId: string;
}

interface MealPlanContextType {
  // Current week view
  currentWeek: Date;
  weekMeals: WeekMeals;
  isLoading: boolean;
  error: string | null;

  // Date selection
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  setCurrentWeek: (week: Date) => void;

  // CRUD operations
  addMealToDay: (
    date: string,
    mealType: string,
    recipeId: string
  ) => Promise<void>;
  removeMealFromDay: (
    date: string,
    mealType: string,
    recipeId: string
  ) => Promise<void>;
  moveMeal: (from: MealSlot, to: MealSlot) => Promise<void>;

  // Navigation
  goToNextWeek: () => void;
  goToPreviousWeek: () => void;
  goToToday: () => void;

  // Utilities
  generateShoppingList: (dateRange: {
    start: string;
    end: string;
  }) => Promise<void>;
  duplicateWeek: (sourceWeek: Date, targetWeek: Date) => Promise<void>;
  refreshWeek: () => Promise<void>;
  refreshMealPlan: () => Promise<void>;
}

const MealPlanContext = createContext<MealPlanContextType | undefined>(
  undefined
);

export const useMealPlan = () => {
  const context = useContext(MealPlanContext);
  if (!context) {
    throw new Error("useMealPlan must be used within a MealPlanProvider");
  }
  return context;
};

interface MealPlanProviderProps {
  children: ReactNode;
}

export const MealPlanProvider: React.FC<MealPlanProviderProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState<Date>(
    getWeekStart(new Date())
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [weekMeals, setWeekMeals] = useState<WeekMeals>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Load week meals when user or currentWeek changes
  useEffect(() => {
    if (user?.id) {
      loadWeekMeals();
    }
  }, [user?.id, currentWeek]);

  const loadWeekMeals = async (isRetry: boolean = false) => {
    if (!user?.id) return;

    setIsLoading(true);
    if (!isRetry) {
      setError(null);
      setRetryCount(0);
    }

    try {
      console.log(`[MealPlanContext] Loading meals for user: ${user.id}`);
      const weekStart = currentWeek.toISOString().split("T")[0];
      const meals = await getMealPlansForWeek(user.id, weekStart);
      setWeekMeals(meals);
      setError(null);
      setRetryCount(0);
      console.log(`[MealPlanContext] Successfully loaded meals`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load meal plans";
      setError(errorMessage);
      console.error("Error loading week meals:", err);

      // Auto-retry for network errors (up to 3 times)
      if (retryCount < 3 && errorMessage.toLowerCase().includes("network")) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        console.log(
          `[MealPlanContext] Auto-retrying (${newRetryCount}/3) in 2 seconds...`
        );
        setTimeout(() => {
          loadWeekMeals(true);
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addMealToDay = async (
    date: string,
    mealType: string,
    recipeId: string
  ): Promise<void> => {
    if (!user?.id) throw new Error("User not authenticated");

    try {
      setError(null);
      await addMealPlanItem(user.id, date, {
        recipe_id: recipeId,
        meal_type: mealType as "breakfast" | "lunch" | "dinner" | "snack",
      });

      // Refresh the week data
      await loadWeekMeals();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add meal";
      setError(errorMessage);
      throw err;
    }
  };

  const removeMealFromDay = async (
    date: string,
    mealType: string,
    recipeId: string
  ): Promise<void> => {
    if (!user?.id) throw new Error("User not authenticated");

    try {
      setError(null);

      // Find the meal plan item to remove
      const dayMeals = weekMeals[date]?.[mealType] || [];
      const itemToRemove = dayMeals.find((item) => item.recipe_id === recipeId);

      if (!itemToRemove) {
        throw new Error("Meal not found");
      }

      await removeMealPlanItem(itemToRemove.id);

      // Refresh the week data
      await loadWeekMeals();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove meal";
      setError(errorMessage);
      throw err;
    }
  };

  const moveMeal = async (from: MealSlot, to: MealSlot): Promise<void> => {
    if (!user?.id) throw new Error("User not authenticated");

    try {
      setError(null);

      // Remove from source
      await removeMealFromDay(from.date, from.mealType, from.recipeId);

      // Add to destination
      await addMealToDay(to.date, to.mealType, from.recipeId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to move meal";
      setError(errorMessage);
      throw err;
    }
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentWeek(getWeekStart(nextWeek));
  };

  const goToPreviousWeek = () => {
    const previousWeek = new Date(currentWeek);
    previousWeek.setDate(previousWeek.getDate() - 7);
    setCurrentWeek(getWeekStart(previousWeek));
  };

  const goToToday = () => {
    setCurrentWeek(getWeekStart(new Date()));
  };

  const generateShoppingList = async (dateRange: {
    start: string;
    end: string;
  }): Promise<void> => {
    if (!user?.id) throw new Error("User not authenticated");

    try {
      setError(null);
      await generateShoppingListFromMealPlan(user.id, dateRange);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate shopping list";
      setError(errorMessage);
      throw err;
    }
  };

  const duplicateWeek = async (
    sourceWeek: Date,
    targetWeek: Date
  ): Promise<void> => {
    if (!user?.id) throw new Error("User not authenticated");

    try {
      setError(null);

      // Get source week meals
      const sourceWeekStart = getWeekStart(sourceWeek)
        .toISOString()
        .split("T")[0];
      const sourceMeals = await getMealPlansForWeek(user.id, sourceWeekStart);

      // Get target week dates
      const targetWeekStart = getWeekStart(targetWeek);
      const targetDates = getWeekDates(targetWeekStart);
      const sourceDates = getWeekDates(getWeekStart(sourceWeek));

      // Copy meals from source to target
      for (let i = 0; i < 7; i++) {
        const sourceDate = sourceDates[i];
        const targetDate = targetDates[i];
        const sourceDayMeals = sourceMeals[sourceDate];

        if (sourceDayMeals) {
          for (const mealType of ["breakfast", "lunch", "dinner", "snack"]) {
            const meals = sourceDayMeals[mealType] || [];
            for (const meal of meals) {
              await addMealToDay(targetDate, mealType, meal.recipe_id);
            }
          }
        }
      }

      // Refresh if we're viewing the target week
      if (targetWeekStart.getTime() === currentWeek.getTime()) {
        await loadWeekMeals();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to duplicate week";
      setError(errorMessage);
      throw err;
    }
  };

  const refreshWeek = async (): Promise<void> => {
    setRetryCount(0);
    await loadWeekMeals();
  };

  const refreshMealPlan = async (): Promise<void> => {
    await refreshWeek();
  };

  const value: MealPlanContextType = {
    currentWeek,
    weekMeals,
    isLoading,
    error,
    selectedDate,
    setSelectedDate,
    setCurrentWeek,
    addMealToDay,
    removeMealFromDay,
    moveMeal,
    goToNextWeek,
    goToPreviousWeek,
    goToToday,
    generateShoppingList,
    duplicateWeek,
    refreshWeek,
    refreshMealPlan,
  };

  return (
    <MealPlanContext.Provider value={value}>
      {children}
    </MealPlanContext.Provider>
  );
};
