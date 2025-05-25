# Recipes Screen Loading Fix

## Problem

The recipes screen was stuck in an infinite loading loop due to complex state management and circular dependencies between `useEffect` hooks and the `fetchRecipes` function.

## Root Causes

1. **Circular Dependencies**: `fetchRecipes` was in dependency arrays of multiple `useEffect` hooks, but `fetchRecipes` itself depended on state that those hooks were managing
2. **Over-complicated State**: `hasInitiallyLoaded`, `isLoading`, and multiple refresh mechanisms were conflicting
3. **Multiple Fetch Triggers**: Initial mount, focus effect, and event listeners were all triggering fetches simultaneously

## Solution

Completely simplified the component by:

### 1. Removed Complex State Management

- Removed `hasInitiallyLoaded` state
- Simplified `fetchRecipes` to a regular async function (not `useCallback`)
- Removed circular dependency checks

### 2. Simplified useEffect Hooks

- **Initial fetch**: Simple dependency on `user?.id` only
- **Event listener**: Simple dependency on `user?.id` and `isLoading`
- **Focus effect**: Only refreshes if user exists and recipes already loaded

### 3. Streamlined Loading Logic

- Loading indicator shows when `isLoading && recipes.length === 0`
- Empty state shows when `!isLoading && recipes.length === 0`
- Normal view shows when recipes exist

## Key Changes Made

```typescript
// BEFORE: Complex useCallback with circular dependencies
const fetchRecipes = useCallback(
  async (showRefreshIndicator = false) => {
    // Complex logic with hasInitiallyLoaded checks
  },
  [user?.id, isLoading, hasInitiallyLoaded]
); // Circular dependency!

// AFTER: Simple async function
const fetchRecipes = async (showRefreshIndicator = false) => {
  // Simple logic, no complex state checks
};
```

```typescript
// BEFORE: Complex initial fetch
useEffect(() => {
  if (user?.id && !hasInitiallyLoaded) {
    fetchRecipes();
  }
}, [user?.id, hasInitiallyLoaded, fetchRecipes]); // Circular!

// AFTER: Simple initial fetch
useEffect(() => {
  if (user?.id) {
    fetchRecipes();
  }
}, [user?.id]); // Clean dependency
```

## Result

- ✅ No more infinite loading loops
- ✅ Clean, predictable loading behavior
- ✅ Proper refresh on focus and events
- ✅ Simple, maintainable code

## Testing

The screen should now:

1. Load recipes on initial mount
2. Show loading indicator only during first load
3. Refresh when returning from other screens
4. Refresh when recipe events are emitted
5. Handle pull-to-refresh properly
