# Component Adaptation Plan

This document outlines the specific steps needed to adapt the imported React components to React Native for our Expo app, based on the files we've imported from the `recipesExpoMigration` repository.

## General Adaptation Rules

1. Convert HTML elements to React Native components:

   - `div` → `View`
   - `span`, `p`, `h1`, etc. → `Text`
   - `img` → `Image`
   - `button` → `Pressable` or `TouchableOpacity`
   - `input` → `TextInput`

2. Replace CSS/TailwindCSS with React Native StyleSheet:

   - Convert TailwindCSS classes to StyleSheet objects
   - Replace `className` with `style`
   - Use `flexDirection: "row"` instead of flex classes
   - Use numeric values for sizes (no px, rem, etc.)

3. Update event handlers:

   - `onClick` → `onPress`
   - `onChange` → `onChangeText` for text inputs

4. Update imports:

   - Replace web-specific libraries with React Native equivalents
   - Update component import paths
   - Replace icon libraries (e.g., Lucide) with Expo Vector Icons

5. Navigation:
   - Replace React Router with Expo Router
   - Update navigation patterns

## Priority Components

Based on the project overview, we should prioritize adapting these components:

1. First Phase (Core Structure):

   - `Layout.tsx` - Fundamental layout and navigation
   - `RecipeCard.tsx` - Core display component
   - `EmptyState.tsx` - UI utility

2. Second Phase (Functional Components):
   - `IngredientInput.tsx` - Recipe creation
   - `NetworkStatus.tsx` - App usability
   - `UserMenu.tsx` - Authentication/user management
3. Final Phase (Enhanced Features):
   - `TodaysMealPlan.tsx` & `WeeklyMealSelector.tsx` - Meal planning
   - `NutritionDisplay.tsx` & `NutrientDisplay.tsx` - Nutrition tracking

## Component-Specific Adaptation Notes

### Layout.tsx

**Current Dependencies:**

- React Router
- Lucide icons
- Framer Motion
- UI components from shadcn/ui

**Adaptation Steps:**

1. Replace Router components with Expo Router
2. Replace Lucide icons with Expo Vector Icons
3. Implement bottom tabs navigation using Expo Router tabs
4. Replace Framer Motion with React Native Animated or Reanimated
5. Replace web-specific UI components with React Native components

### RecipeCard.tsx

**Current Dependencies:**

- React Router Link
- Tailwind classes

**Adaptation Steps:**

1. Replace React Router Link with Expo Router Link
2. Convert TailwindCSS classes to StyleSheet
3. Replace HTML structure with React Native components
4. Handle image loading with proper React Native patterns

### NetworkStatus.tsx & NetworkStatusBar.tsx

**Current Dependencies:**

- React context for network state
- Web APIs for online/offline detection

**Adaptation Steps:**

1. Use `@react-native-community/netinfo` for network status
2. Create custom hook for network state
3. Adapt UI for React Native

### IngredientInput.tsx

**Current Dependencies:**

- Form elements
- Autocomplete functionality

**Adaptation Steps:**

1. Replace form inputs with React Native TextInput
2. Implement autocomplete with React Native compatible library
3. Adapt styling for mobile

### UserMenu.tsx

**Current Dependencies:**

- Popover component
- Authentication context

**Adaptation Steps:**

1. Replace popover with React Native Modal or similar component
2. Connect to authentication context
3. Adapt UI for touch interactions

## Supporting Files to Create

1. **Types**:

   - Create `types/index.ts` with shared interfaces

2. **Hooks**:

   - Create `hooks/useNetworkStatus.ts`
   - Create `hooks/useColorScheme.ts` (already exists)

3. **Context**:

   - Create `context/RecipeContext.tsx`
   - Create `context/AuthContext.tsx`

4. **Utilities**:
   - Create `utils/styleUtils.ts` for shared styling patterns
   - Create `utils/formatters.ts` for text/date formatting

## Implementation Timeline

1. **Week 1: Core Infrastructure**

   - Set up project structure
   - Adapt Layout and navigation
   - Create base context providers

2. **Week 2: Recipe Management**

   - Adapt RecipeCard
   - Implement recipe listing
   - Connect to backend

3. **Week 3: User Experience**

   - Adapt NetworkStatus
   - Implement UserMenu
   - Add offline capabilities

4. **Week 4: Advanced Features**
   - Implement nutrition components
   - Implement meal planning features
   - Polish and testing

## Best Practices

1. **Component Organization**:

   - Keep related components in the same directory
   - Use index files for cleaner imports

2. **Code Style**:

   - Use TypeScript for all components
   - Follow consistent naming conventions

3. **State Management**:

   - Use context for global state
   - Use local state for component-specific state

4. **Performance**:

   - Use memo, useMemo, useCallback appropriately
   - Optimize list rendering with FlatList

5. **Testing**:
   - Test components in isolation
   - Test on multiple devices and screen sizes
