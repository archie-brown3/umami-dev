import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { demoStore } from "@/lib/demoStore";
import { MealPlanItem, WeekMeals } from "./mealPlanTypes";

export { MealPlanItem, WeekMeals };

export interface MealSlot {
  date: string;
  mealType: string;
  recipeId: string;
}

interface MealPlanContextType {
  currentWeek: Date;
  weekMeals: WeekMeals;
  isLoading: boolean;
  error: string | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  setCurrentWeek: (week: Date) => void;
  addMealToDay: (date: string, mealType: string, recipeId: string) => Promise<void>;
  removeMealFromDay: (date: string, mealType: string, recipeId: string) => Promise<void>;
  moveMeal: (from: MealSlot, to: MealSlot) => Promise<void>;
  goToNextWeek: () => void;
  goToPreviousWeek: () => void;
  goToToday: () => void;
  generateShoppingList: (
    dateRange: { start: string; end: string },
    options?: {
      consolidateSimilar?: boolean;
      addToExistingList?: boolean;
      excludePantryItems?: boolean;
    }
  ) => Promise<void>;
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

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(weekStart: Date): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

interface MealPlanProviderProps {
  children: React.ReactNode;
}

export const MealPlanProvider: React.FC<MealPlanProviderProps> = ({
  children,
}) => {
  const [currentWeek, setCurrentWeek] = useState<Date>(
    getWeekStart(new Date())
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [weekMeals, setWeekMeals] = useState<WeekMeals>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWeekMeals = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const weekStart = currentWeek.toISOString().split("T")[0];
      const meals = demoStore.getMealPlansForWeek("demo-user-001", weekStart);
      setWeekMeals(meals);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load meal plans";
      setError(errorMessage);
      console.error("Error loading week meals:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWeekMeals();
  }, [currentWeek]);

  const addMealToDay = async (
    date: string,
    mealType: string,
    recipeId: string
  ): Promise<void> => {
    try {
      setError(null);
      demoStore.addMealPlanItem("demo-user-001", date, {
        recipe_id: recipeId,
        meal_type: mealType,
      });
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
    try {
      setError(null);
      const dayMeals = weekMeals[date]?.[mealType] || [];
      const itemToRemove = dayMeals.find((item) => item.recipe_id === recipeId);
      if (!itemToRemove) {
        throw new Error("Meal not found");
      }
      demoStore.removeMealPlanItem(itemToRemove.id);
      await loadWeekMeals();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove meal";
      setError(errorMessage);
      throw err;
    }
  };

  const moveMeal = async (from: MealSlot, to: MealSlot): Promise<void> => {
    try {
      setError(null);
      await removeMealFromDay(from.date, from.mealType, from.recipeId);
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

  const generateShoppingList = async (
    dateRange: { start: string; end: string },
    options?: {
      consolidateSimilar?: boolean;
      addToExistingList?: boolean;
      excludePantryItems?: boolean;
    }
  ): Promise<void> => {
    console.log("generateShoppingList called (demo mode)", dateRange, options);
  };

  const duplicateWeek = async (
    sourceWeek: Date,
    targetWeek: Date
  ): Promise<void> => {
    try {
      setError(null);
      const sourceWeekStart = getWeekStart(sourceWeek)
        .toISOString()
        .split("T")[0];
      const sourceMeals = demoStore.getMealPlansForWeek(
        "demo-user-001",
        sourceWeekStart
      );
      const targetDates = getWeekDates(getWeekStart(targetWeek));
      const sourceDates = getWeekDates(getWeekStart(sourceWeek));

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

      if (targetWeek.getTime() === currentWeek.getTime()) {
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
