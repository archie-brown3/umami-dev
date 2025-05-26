# Meal Planning & Groceries Implementation Plan

## Overview

This plan outlines the implementation of comprehensive meal planning and groceries features that integrate with the existing recipe system. The design prioritizes lightweight database usage, efficient state management, and seamless user experience.

## 🚀 IMPLEMENTATION IMPROVEMENTS & ENHANCEMENTS

### Current State Analysis (January 2025)

#### ✅ Completed Features

- **Basic Meal Planning CRUD**: Full implementation with database integration
- **Weekly Calendar View**: Interactive calendar with meal slots
- **Recipe Integration**: Seamless connection to existing recipe system
- **Shopping List Generation**: Automatic generation from meal plans with ingredient consolidation
- **Database Services**: Complete `mealPlanService.ts` and `groceriesService.ts`
- **Context Management**: `MealPlanContext` with week navigation and CRUD operations
- **UI Components**: `WeeklyCalendar`, `MealSlot`, and `RecipePicker` components
- **Debug Integration**: Enhanced testing capabilities in debug page

#### 🔄 In Progress

- **GroceriesContext Enhancement**: Supabase integration with minor TypeScript fixes needed
- **Error Handling**: Comprehensive error states and retry logic
- **Offline Support**: Basic AsyncStorage fallback implemented

#### 🆕 Immediate Improvements Needed

### 1. Enhanced Database Schema Optimizations

#### 1.1 Nutrition Integration

```sql
-- Add nutrition tracking to meal plans
ALTER TABLE meal_plan_items ADD COLUMN servings_multiplier DECIMAL DEFAULT 1.0;
ALTER TABLE meal_plan_items ADD COLUMN notes TEXT;

-- Create nutrition aggregation view
CREATE VIEW meal_plan_nutrition AS
SELECT
  mp.id as meal_plan_id,
  mp.date,
  SUM(rn.calories * mpi.servings_multiplier) as total_calories,
  SUM(CAST(rn.protein AS DECIMAL) * mpi.servings_multiplier) as total_protein,
  SUM(CAST(rn.carbs AS DECIMAL) * mpi.servings_multiplier) as total_carbs,
  SUM(CAST(rn.fat AS DECIMAL) * mpi.servings_multiplier) as total_fat
FROM meal_plans mp
JOIN meal_plan_items mpi ON mp.id = mpi.meal_plan_id
JOIN recipe_nutrition rn ON mpi.recipe_id = rn.recipe_id
GROUP BY mp.id, mp.date;
```

#### 1.2 Smart Shopping Lists

```sql
-- Add pantry/inventory tracking
CREATE TABLE pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  ingredient_id UUID REFERENCES ingredients(id),
  quantity TEXT,
  unit TEXT,
  expiration_date DATE,
  location TEXT, -- fridge, pantry, freezer
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add shopping list templates
CREATE TABLE shopping_list_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add meal plan templates
CREATE TABLE meal_plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER DEFAULT 7,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Advanced Meal Planning Features

#### 2.1 Smart Meal Suggestions

**File: `services/mealSuggestionService.ts`**

```typescript
export interface MealSuggestion {
  recipe: Recipe;
  score: number;
  reasons: string[];
  nutritionFit: number;
  seasonalScore: number;
  varietyScore: number;
}

export const generateMealSuggestions = async (
  userId: string,
  date: string,
  mealType: string,
  preferences: UserPreferences
): Promise<MealSuggestion[]> => {
  // AI-powered suggestions based on:
  // 1. Previous meal history
  // 2. Nutritional balance
  // 3. Seasonal ingredients
  // 4. Dietary restrictions
  // 5. Cooking time preferences
  // 6. Ingredient availability
};

export const balanceWeekNutrition = async (
  userId: string,
  weekStart: string
): Promise<NutritionBalance> => {
  // Analyze week's nutrition and suggest adjustments
};
```

#### 2.2 Meal Plan Templates & Automation

**File: `services/mealPlanTemplateService.ts`**

```typescript
export interface MealPlanTemplate {
  id: string;
  name: string;
  description: string;
  duration: number; // days
  meals: {
    [dayOffset: number]: {
      [mealType: string]: {
        recipeId?: string;
        category?: string; // "protein", "vegetarian", etc.
        tags?: string[];
      }[];
    };
  };
}

export const applyTemplate = async (
  userId: string,
  templateId: string,
  startDate: string
): Promise<void> => {
  // Apply template to specific week with smart recipe substitution
};

export const createTemplateFromWeek = async (
  userId: string,
  weekStart: string,
  templateName: string
): Promise<MealPlanTemplate> => {
  // Convert existing week into reusable template
};
```

### 3. Intelligent Shopping List Features

#### 3.1 Pantry Integration

**File: `services/pantryService.ts`**

```typescript
export interface PantryItem {
  id: string;
  ingredientId: string;
  name: string;
  quantity: string;
  unit?: string;
  location: "fridge" | "pantry" | "freezer";
  expirationDate?: string;
  lowStockThreshold?: number;
}

export const checkPantryAvailability = async (
  userId: string,
  ingredients: ShoppingItem[]
): Promise<{
  available: PantryItem[];
  needed: ShoppingItem[];
  expiringSoon: PantryItem[];
}> => {
  // Cross-reference shopping list with pantry inventory
};

export const suggestPantryUsage = async (userId: string): Promise<Recipe[]> => {
  // Suggest recipes based on expiring pantry items
};
```

#### 3.2 Smart Shopping List Generation

**File: `services/smartShoppingService.ts`**

```typescript
export interface SmartShoppingOptions {
  excludePantryItems: boolean;
  consolidateSimilar: boolean;
  optimizeForStore: string; // store layout optimization
  budgetLimit?: number;
  preferredBrands?: string[];
  dietaryRestrictions?: string[];
}

export const generateSmartShoppingList = async (
  userId: string,
  mealPlanIds: string[],
  options: SmartShoppingOptions
): Promise<ShoppingList> => {
  // 1. Extract all ingredients from meal plans
  // 2. Check against pantry inventory
  // 3. Consolidate similar items
  // 4. Optimize store layout order
  // 5. Apply budget constraints
  // 6. Suggest alternatives for dietary restrictions
};

export const optimizeShoppingRoute = async (
  shoppingListId: string,
  storeLayout: StoreLayout
): Promise<ShoppingItem[]> => {
  // Reorder items for efficient shopping route
};
```

### 4. Enhanced User Experience Features

#### 4.1 Drag & Drop Meal Planning

**File: `components/meal-plan/DragDropCalendar.tsx`**

```typescript
export const DragDropCalendar: React.FC = () => {
  const [draggedRecipe, setDraggedRecipe] = useState<Recipe | null>(null);

  const handleDrop = async (date: string, mealType: string, recipe: Recipe) => {
    // Handle drag and drop with visual feedback
    await addMealToDay(date, mealType, recipe.id);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {/* Enhanced calendar with drag/drop support */}
    </DragDropContext>
  );
};
```

#### 4.2 Nutrition Dashboard

**File: `components/meal-plan/NutritionDashboard.tsx`**

```typescript
export const NutritionDashboard: React.FC<{ weekStart: string }> = ({
  weekStart,
}) => {
  const [weekNutrition, setWeekNutrition] = useState<WeekNutrition | null>(
    null
  );

  return (
    <View style={styles.dashboard}>
      <NutritionChart data={weekNutrition} />
      <MacroBreakdown macros={weekNutrition?.macros} />
      <NutritionGoals goals={userGoals} current={weekNutrition} />
      <SuggestionCards suggestions={nutritionSuggestions} />
    </View>
  );
};
```

### 5. Advanced Integration Features

#### 5.1 Recipe Scaling & Batch Cooking

**File: `services/recipeScalingService.ts`**

```typescript
export const scaleRecipeForMealPlan = async (
  recipeId: string,
  targetServings: number,
  mealPlanContext: {
    totalPeople: number;
    leftoverPreference: "none" | "some" | "lots";
  }
): Promise<ScaledRecipe> => {
  // Intelligent recipe scaling with ingredient optimization
};

export const suggestBatchCooking = async (
  userId: string,
  weekStart: string
): Promise<BatchCookingSuggestion[]> => {
  // Identify recipes that can be batch cooked together
};
```

#### 5.2 Seasonal & Local Ingredient Optimization

**File: `services/seasonalService.ts`**

```typescript
export const getSeasonalIngredients = async (
  location: string,
  month: number
): Promise<Ingredient[]> => {
  // Return seasonal ingredients for location and time
};

export const suggestSeasonalRecipes = async (
  userId: string,
  preferences: UserPreferences
): Promise<Recipe[]> => {
  // Suggest recipes based on seasonal availability
};
```

### 6. Performance & Offline Enhancements

#### 6.1 Advanced Caching Strategy

**File: `services/cacheService.ts`**

```typescript
export class MealPlanCache {
  private static instance: MealPlanCache;
  private cache = new Map<string, CacheEntry>();

  async getCachedMealPlan(
    userId: string,
    weekStart: string
  ): Promise<WeekMeals | null> {
    // Intelligent caching with TTL and invalidation
  }

  async prefetchUpcomingWeeks(
    userId: string,
    currentWeek: string
  ): Promise<void> {
    // Prefetch next 2-3 weeks for offline access
  }

  async syncPendingChanges(): Promise<void> {
    // Sync offline changes when connection restored
  }
}
```

#### 6.2 Optimistic Updates

**File: `hooks/useOptimisticMealPlan.ts`**

```typescript
export const useOptimisticMealPlan = () => {
  const [optimisticState, setOptimisticState] = useState<WeekMeals>({});
  const [pendingOperations, setPendingOperations] = useState<Operation[]>([]);

  const addMealOptimistically = async (
    date: string,
    mealType: string,
    recipeId: string
  ) => {
    // Immediately update UI, queue operation for sync
    updateUIImmediately();
    queueOperation({ type: "add", date, mealType, recipeId });

    try {
      await syncOperation();
    } catch (error) {
      revertOptimisticUpdate();
    }
  };

  return { optimisticState, addMealOptimistically /* ... */ };
};
```

### 7. Analytics & Insights

#### 7.1 Meal Planning Analytics

**File: `services/analyticsService.ts`**

```typescript
export interface MealPlanAnalytics {
  weeklyStats: {
    recipesUsed: number;
    cuisineVariety: string[];
    nutritionBalance: NutritionScore;
    costEstimate: number;
  };
  trends: {
    favoriteRecipes: Recipe[];
    preferredMealTypes: { [mealType: string]: number };
    seasonalPatterns: SeasonalPattern[];
  };
  suggestions: {
    varietyImprovements: string[];
    nutritionOptimizations: string[];
    costSavingTips: string[];
  };
}

export const generateMealPlanInsights = async (
  userId: string,
  timeRange: { start: string; end: string }
): Promise<MealPlanAnalytics> => {
  // Generate comprehensive analytics and insights
};
```

### 8. Social & Sharing Features

#### 8.1 Meal Plan Sharing

**File: `services/sharingService.ts`**

```typescript
export const shareMealPlan = async (
  mealPlanId: string,
  shareOptions: {
    includeShoppingList: boolean;
    includeNutrition: boolean;
    allowEditing: boolean;
  }
): Promise<ShareLink> => {
  // Generate shareable meal plan links
};

export const importSharedMealPlan = async (
  userId: string,
  shareToken: string,
  targetWeek: string
): Promise<void> => {
  // Import shared meal plan to user's calendar
};
```

### 9. Enhanced Testing & Quality Assurance

#### 9.1 Comprehensive Test Suite

**File: `__tests__/mealPlanning.integration.test.ts`**

```typescript
describe("Meal Planning Integration", () => {
  test("complete meal planning workflow", async () => {
    // Test full user journey from planning to shopping
    const user = await createTestUser();
    const recipes = await createTestRecipes();

    // Plan a week
    await planWeekMeals(user.id, recipes);

    // Generate shopping list
    const shoppingList = await generateShoppingList(user.id);

    // Verify nutrition balance
    const nutrition = await getWeekNutrition(user.id);
    expect(nutrition.isBalanced).toBe(true);

    // Test offline functionality
    await testOfflineSync(user.id);
  });
});
```

### 10. Mobile-Specific Enhancements

#### 10.1 Voice Integration

**File: `services/voiceService.ts`**

```typescript
export const voiceCommands = {
  "add [recipe] to [day] [meal]": addMealByVoice,
  "what's for dinner [day]": getMealsByVoice,
  "generate shopping list": generateShoppingListByVoice,
  "mark [item] as bought": markItemBoughtByVoice,
};

export const enableVoiceControl = () => {
  // Integrate with device voice recognition
};
```

#### 10.2 Widget Support

**File: `widgets/MealPlanWidget.tsx`**

```typescript
export const MealPlanWidget: React.FC = () => {
  // Home screen widget showing today's meals
  return (
    <WidgetContainer>
      <TodaysMeals />
      <QuickActions />
    </WidgetContainer>
  );
};
```

## Implementation Priority Matrix

### Phase 1 (Immediate - Week 1-2)

- ✅ Basic meal planning CRUD
- ✅ Shopping list generation
- 🔄 Fix TypeScript errors in GroceriesContext
- 🆕 Add nutrition dashboard
- 🆕 Implement pantry integration

### Phase 2 (Short-term - Week 3-4)

- 🆕 Drag & drop meal planning
- 🆕 Meal plan templates
- 🆕 Smart shopping list optimization
- 🆕 Offline sync improvements
- 🆕 Recipe scaling

### Phase 3 (Medium-term - Week 5-6)

- 🆕 AI meal suggestions
- 🆕 Seasonal ingredient optimization
- 🆕 Batch cooking suggestions
- 🆕 Analytics dashboard
- 🆕 Voice commands

### Phase 4 (Long-term - Week 7-8)

- 🆕 Social sharing features
- 🆕 Advanced analytics
- 🆕 Widget support
- 🆕 Store integration
- 🆕 Meal plan marketplace

## Key Improvements Summary

1. **Enhanced Database Schema**: Added nutrition tracking, pantry management, and templates
2. **AI-Powered Features**: Smart suggestions, seasonal optimization, nutrition balancing
3. **Advanced UX**: Drag & drop, voice control, widgets, offline-first design
4. **Performance**: Optimistic updates, intelligent caching, prefetching
5. **Analytics**: Comprehensive insights, trends, and recommendations
6. **Social Features**: Sharing, importing, community meal plans
7. **Mobile-First**: Voice integration, widgets, gesture controls
8. **Quality Assurance**: Comprehensive testing, error handling, monitoring

These improvements transform the basic meal planning system into a comprehensive, intelligent, and user-friendly platform that adapts to user preferences and provides valuable insights.

## 🎯 IMMEDIATE NEXT STEPS (Priority Order)

### Step 1: Fix Current Issues (1-2 hours)

1. **Complete GroceriesContext TypeScript fixes** ✅ (Just completed)
2. **Test meal planning workflow end-to-end**
3. **Fix any remaining linter errors**
4. **Test shopping list generation from meal plans**

### Step 2: Enhance Core UX (1-2 days)

1. **Add nutrition dashboard to meal plan view**

   ```typescript
   // Add to WeeklyCalendar.tsx
   <NutritionSummary weekStart={currentWeek} />
   ```

2. **Implement serving size adjustments**

   ```typescript
   // Add to MealSlot.tsx
   <ServingAdjuster
     currentServings={meal.servings}
     onServingsChange={handleServingsChange}
   />
   ```

3. **Add meal plan templates**
   ```typescript
   // Create components/meal-plan/TemplateSelector.tsx
   <TemplateSelector onApplyTemplate={applyTemplate} />
   ```

### Step 3: Smart Features (3-5 days)

1. **Pantry integration**

   - Create pantry management screen
   - Integrate with shopping list generation
   - Add expiration tracking

2. **Recipe suggestions**

   - Implement basic suggestion algorithm
   - Add "Suggest Recipe" button to empty meal slots
   - Consider nutrition balance and variety

3. **Batch cooking detection**
   - Identify recipes that can be made together
   - Suggest optimal cooking days
   - Scale ingredients accordingly

### Step 4: Advanced Features (1-2 weeks)

1. **Drag & drop meal planning**
2. **Voice commands integration**
3. **Analytics dashboard**
4. **Social sharing features**

## 🔧 TECHNICAL IMPROVEMENTS

### Performance Optimizations

1. **Implement optimistic updates** for better UX
2. **Add intelligent caching** for offline support
3. **Prefetch upcoming weeks** for faster navigation
4. **Batch database operations** to reduce API calls

### User Experience Enhancements

1. **Add haptic feedback** for mobile interactions
2. **Implement gesture controls** (swipe to navigate weeks)
3. **Add quick actions** (long press for context menus)
4. **Improve loading states** with skeleton screens

### Data Intelligence

1. **Nutrition analysis** with daily/weekly summaries
2. **Cost estimation** for shopping lists
3. **Seasonal ingredient suggestions**
4. **Recipe difficulty balancing** across the week

These improvements transform the basic meal planning system into a comprehensive, intelligent, and user-friendly platform that adapts to user preferences and provides valuable insights.
