# Navigation Implementation

This document provides an overview of the navigation structure and components implemented in the Recipe Saver Expo app.

## Navigation Structure

The navigation system is built using Expo Router with a file-based routing approach and follows these key patterns:

1. **Root Layout** (`app/_layout.tsx`)

   - Contains the main Stack Navigator
   - Provides the RecipeProvider context
   - Defines routes for tabs, recipe details, and adding recipes

2. **Tab Navigation** (`app/(tabs)/_layout.tsx`)

   - Bottom tab navigation with 4 main tabs
   - Custom floating action button for adding recipes
   - NetworkStatusBar for connectivity display
   - Tab screens for Home, Recipes, Meal Plan, and Shopping

3. **Modal Screens**

   - Add Recipe (`app/add-recipe.tsx`) - Presented as a modal
   - Multi-tab interface for various recipe input methods

4. **Stack Screens**
   - Recipe Detail (`app/recipe/[id].tsx`) - Dynamic route with ID parameter

## Key Components

### Screen Components

1. **HomeScreen** (`app/(tabs)/index.tsx`)

   - Dashboard with summary statistics
   - Quick access to favorites and other sections
   - Empty state for first-time users

2. **RecipesScreen** (`app/(tabs)/recipes.tsx`)

   - List of saved recipes
   - Empty state with guidance for adding recipes

3. **MealPlanScreen** (`app/(tabs)/meal-plan.tsx`)

   - Weekly meal planning interface
   - Empty state with call-to-action

4. **ShoppingScreen** (`app/(tabs)/shopping.tsx`)

   - Shopping list management
   - Empty state with options to add items

5. **RecipeDetailScreen** (`app/recipe/[id].tsx`)

   - Detailed view of a specific recipe
   - Ingredients and instructions display

6. **AddRecipeScreen** (`app/add-recipe.tsx`)
   - Multi-tab interface for recipe input
   - Options for manual, URL, AI, and Instagram input

### UI Components

1. **EmptyState** (`app/components/ui/EmptyState.tsx`)

   - Reusable empty state with customizable actions
   - Used across various screens

2. **NetworkStatusBar** (`app/components/layout/NetworkStatusBar.tsx`)
   - Connection status indicator
   - Integrated in tab layout

## Route Mapping

| Path                | Component          | Description             |
| ------------------- | ------------------ | ----------------------- |
| `/`                 | HomeScreen         | Dashboard with overview |
| `/(tabs)/recipes`   | RecipesScreen      | Recipe collection       |
| `/(tabs)/meal-plan` | MealPlanScreen     | Meal planning           |
| `/(tabs)/shopping`  | ShoppingScreen     | Shopping list           |
| `/recipe/[id]`      | RecipeDetailScreen | Recipe details (stack)  |
| `/add-recipe`       | AddRecipeScreen    | Add recipe (modal)      |

## Navigation Patterns

1. **Tab Navigation**

   ```typescript
   router.push("/(tabs)/recipes" as any);
   ```

2. **Dynamic Routes**

   ```typescript
   router.push(`/recipe/${id}` as any);
   ```

3. **Modal Navigation**

   ```typescript
   router.push("/add-recipe" as any);
   ```

4. **Back Navigation**
   ```typescript
   router.back();
   ```

## Type Safety

Due to TypeScript limitations with Expo Router's path types, we're currently using type assertions (`as any`) for router navigation. In a production app, proper type definitions would be created to avoid these assertions.

## Future Enhancements

1. **Proper TypeScript Types** - Create type definitions for route paths
2. **Deep Linking** - Configure for external link handling
3. **Authentication Flow** - Add authentication screens and protected routes
4. **Custom Animations** - Enhance transitions between screens
