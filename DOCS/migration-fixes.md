# Migration Fixes for React to React Native Layout

This document outlines the fixes that were necessary after directly importing the React Layout component into the Expo app.

## Issues and Fixes

### 1. Root Layout Issues

**Problem**: The app's root layout (`app/_layout.tsx`) was replaced with a React web component that uses:

- React Router DOM instead of Expo Router
- HTML elements (div, header, nav) instead of React Native components
- Lucide icons instead of React Native icons
- CSS classes instead of StyleSheet

**Fix**:

- Reverted to a simplified Expo-compatible root layout using Stack navigation
- Retained Stack.Screen configurations for routing
- Kept RecipeProvider for state management

### 2. Missing Dependencies

**Problem**: The imported React layout referenced components and libraries not available in React Native:

- lucide-react icons
- framer-motion animations
- React web components (Button, Popover, etc.)
- CSS classes and Tailwind utilities

**Fix**:

- Installed necessary React Native equivalents (@react-native-community/netinfo)
- Created simplified versions of components (NetworkStatusBar)
- Fixed path references in import statements

### 3. Not Found Screen

**Problem**: The not-found screen used ThemedText and ThemedView components which don't exist in the Expo app.

**Fix**:

- Replaced with standard React Native components (Text, View)
- Applied direct styles instead of themed components

### 4. NetworkStatusBar Component

**Problem**: The NetworkStatusBar component imported from the React app had dependencies on React web components.

**Fix**:

- Created a simplified React Native version using:
  - NetInfo for network detection
  - React Native's View and Text components
  - StyleSheet for styling

### 5. Style Utilities

**Problem**: Shadow and style utilities in the React app used different parameters than the Expo app.

**Fix**:

- Updated the createShadow function to accept the expected parameters
- Ensured consistent usage of style utilities across components

## Navigation Structure Preserved

The navigation structure defined in the migration documentation was preserved:

1. Tab-based navigation with Home, Recipes, Meal Plan, and Shopping
2. Stack navigation for recipe details
3. Modal presentation for adding recipes

## Next Steps

1. Run the app on iOS/Android simulators or devices
2. Test navigation between screens
3. Complete the conversion of remaining components from React to React Native
4. Fix any remaining style or layout issues
5. Implement any missing functionality in the core navigation components
