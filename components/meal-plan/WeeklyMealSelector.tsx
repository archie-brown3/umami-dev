import React, { useEffect } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { useRecipes } from "../context/RecipeContext";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface WeeklyMealSelectorProps {
  recipeId: string;
  currentDate: Date;
  onSlotSelect: (dayString: string, mealType: string) => void;
}

const WeeklyMealSelector: React.FC<WeeklyMealSelectorProps> = ({
  recipeId,
  currentDate,
  onSlotSelect,
}) => {
  const { mealPlan, getRecipeById } = useRecipes();

  // For debugging - log mealPlan contents
  useEffect(() => {
    console.log("Meal Plan Data:", mealPlan);
    console.log("Current Date:", format(currentDate, "yyyy-MM-dd"));
    if (mealPlan.dayMeals) {
      console.log("Days in meal plan:", Object.keys(mealPlan.dayMeals));
    }
  }, [mealPlan, currentDate]);

  // Calculate start of the current week (Sunday)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });

  // Generate an array of weekdays
  const weekdays = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return {
      date,
      dayString: format(date, "yyyy-MM-dd"),
      shortName: format(date, "EEE"),
      fullName: format(date, "EEEE"),
      dayNumber: format(date, "d"),
      month: format(date, "MMM"),
      isToday: format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
    };
  });

  const mealTypes = ["breakfast", "lunch", "dinner", "snacks"];

  // Component for an empty meal slot
  const EmptyMealSlot = ({
    day,
    mealType,
  }: {
    day: string;
    mealType: string;
  }) => (
    <div
      className="h-14 w-full flex items-center justify-center border border-dashed border-muted-foreground/40 rounded-md hover:bg-primary/5 hover:border-primary/40 transition-colors cursor-pointer"
      onClick={() => onSlotSelect(day, mealType)}
      title={`Add ${recipeId} to ${mealType} on ${day}`}
    >
      <Plus className="h-5 w-5 text-muted-foreground" />
    </div>
  );

  // Component for an occupied meal slot
  const OccupiedMealSlot = ({
    day,
    mealType,
    recipeIds,
  }: {
    day: string;
    mealType: string;
    recipeIds: string[];
  }) => {
    const recipesCount = recipeIds.length;

    // Get the first recipe title to display (if any)
    const firstRecipe =
      recipeIds.length > 0 ? getRecipeById(recipeIds[0]) : null;

    return (
      <div
        className="h-14 w-full flex flex-col items-center justify-center p-1 text-xs border rounded-md bg-primary/5 shadow-sm cursor-pointer hover:bg-primary/10"
        onClick={() => onSlotSelect(day, mealType)}
        title={`Add another recipe to ${mealType} on ${day}`}
      >
        {recipesCount === 1 && firstRecipe ? (
          <div className="text-center truncate w-full font-medium">
            {firstRecipe.title}
          </div>
        ) : (
          <>
            <div className="font-medium">{recipesCount} recipes</div>
            <div className="text-xs text-muted-foreground">Add another</div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="grid gap-3">
      {/* Day headers */}
      <div className="grid grid-cols-8 gap-2">
        <div className="flex items-end justify-center pb-1">
          <span className="text-xs font-medium text-muted-foreground"></span>
        </div>
        {weekdays.map((day) => (
          <div
            key={day.dayString}
            className={cn(
              "flex flex-col items-center p-2 rounded-md",
              day.isToday && "bg-primary/10"
            )}
          >
            <span className="text-xs font-medium">{day.shortName}</span>
            <span className="text-lg font-bold">{day.dayNumber}</span>
            <span className="text-xs text-muted-foreground">{day.month}</span>
          </div>
        ))}
      </div>

      {/* Meal type rows with more spacing */}
      {mealTypes.map((mealType) => (
        <div key={mealType} className="grid grid-cols-8 gap-2">
          <div className="flex items-center justify-end pr-2">
            <span className="text-xs font-medium capitalize">{mealType}</span>
          </div>

          {weekdays.map((day) => {
            // Explicitly check if we have a dayMeals structure and if this day exists
            const dayMeals = mealPlan?.dayMeals?.[day.dayString] || {};
            // Cast to the correct type and provide a fallback empty array
            const mealRecipes =
              (dayMeals[mealType as keyof typeof dayMeals] as string[]) || [];

            return (
              <div key={`${day.dayString}-${mealType}`} className="h-14">
                {mealRecipes.length > 0 ? (
                  <OccupiedMealSlot
                    day={day.dayString}
                    mealType={mealType}
                    recipeIds={mealRecipes}
                  />
                ) : (
                  <EmptyMealSlot day={day.dayString} mealType={mealType} />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default WeeklyMealSelector;
