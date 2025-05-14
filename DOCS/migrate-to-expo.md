# File Import & Organization Guide for Expo Migration

I'll provide a summary of each file and recommend where they should be placed in your new Expo app structure. Based on the project overview and the components' functionality, here's the recommended organization:

1. **Layout Components**

```
src/components/layout/
├── Layout.tsx           # Main app layout with navigation
├── NetworkStatus.tsx    # Network connectivity status component
└── NetworkStatusBar.tsx # Network status bar component
```

2. **Recipe Components**

```
src/components/recipes/
├── RecipeCard.tsx       # Card component for displaying recipe previews
└── IngredientInput.tsx  # Input component for recipe ingredients
```

3. **Nutrition Components**

```
src/components/nutrition/
├── NutritionDisplay.tsx # Detailed nutrition information display
└── NutrientDisplay.tsx  # Compact nutrition information display
```

4. **Meal Planning Components**

```
src/components/meal-planning/
├── TodaysMealPlan.tsx   # Today's meal plan display
└── WeeklyMealSelector.tsx # Weekly meal planning interface
```

5. **UI Components**

```
src/components/ui/
└── EmptyState.tsx       # Empty state display component
```

6. **User Components**

```
src/components/user/
└── UserMenu.tsx         # User menu and profile component
```

Here's a detailed breakdown of each component:

1. **Layout Components**

   - `Layout.tsx`: Main app layout with navigation, should be placed in `src/components/layout/` as it's a core structural component
   - `NetworkStatus.tsx` & `NetworkStatusBar.tsx`: Network connectivity components, should be in `src/components/layout/` as they're app-wide status indicators

2. **Recipe Components**

   - `RecipeCard.tsx`: Recipe preview card, should be in `src/components/recipes/` as it's a core recipe display component
   - `IngredientInput.tsx`: Ingredient input with autocomplete, should be in `src/components/recipes/` as it's used in recipe creation/editing

3. **Nutrition Components**

   - `NutritionDisplay.tsx`: Detailed nutrition information, should be in `src/components/nutrition/` as it's a specialized nutrition component
   - `NutrientDisplay.tsx`: Compact nutrition display, should be in `src/components/nutrition/` as it's a related nutrition component

4. **Meal Planning Components**

   - `TodaysMealPlan.tsx`: Today's meal plan display, should be in `src/components/meal-planning/` as it's part of the meal planning feature
   - `WeeklyMealSelector.tsx`: Weekly meal planning interface, should be in `src/components/meal-planning/` as it's part of the meal planning feature

5. **UI Components**

   - `EmptyState.tsx`: Reusable empty state component, should be in `src/components/ui/` as it's a generic UI component

6. **User Components**
   - `UserMenu.tsx`: User menu and profile component, should be in `src/components/user/` as it's user-related functionality

Additional Recommendations:

1. Create a `src/types/` directory for shared TypeScript interfaces
2. Create a `src/hooks/` directory for custom hooks (like `useNetworkStatus`)
3. Create a `src/services/` directory for API and service functions
4. Create a `src/context/` directory for React context providers
5. Create a `src/utils/` directory for utility functions

The current linter errors suggest you'll need to:

1. Set up proper path aliases in your `tsconfig.json` for the `@/` imports
2. Create or import the missing UI components from your component library
3. Set up the required context providers
4. Implement the missing service functions

Would you like me to help you set up any of these directories or fix any of the import issues?

# Migrating Recipe Saver from Capacitor to Expo

This document outlines the complete process for migrating the Recipe Saver app from its current React + Capacitor implementation to a React Native + Expo implementation, allowing for better cross-platform performance and development experience.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Migration Strategy](#migration-strategy)
3. [Project Structure](#project-structure)
4. [Setup Process](#setup-process)
5. [Component Migration Guide](#component-migration-guide)
6. [Navigation Changes](#navigation-changes)
7. [Styling Migration](#styling-migration)
8. [State Management](#state-management)
9. [Platform-Specific Features](#platform-specific-features)
10. [Backend Integration](#backend-integration)
11. [Testing Strategy](#testing-strategy)
12. [Migration Timeline](#migration-timeline)
13. [Troubleshooting](#troubleshooting)

## Project Overview

The current Recipe Saver app:

- **Frontend**: React, TailwindCSS, ShadCN
- **Mobile Adapter**: Capacitor
- **State Management**: Context API
- **Primary Components**: Layout, RecipesPage, RecipeCard, etc.
- **Navigation**: React Router DOM

The migrated Expo app will:

- **Frontend**: React Native + Expo
- **UI Framework**: React Native components with custom styling
- **State Management**: Context API (similar structure, adapted for React Native)
- **Navigation**: Expo Router (file-based routing system)
- **Use same data structures and business logic**: Recipes, Lists, Cupboard, etc.

## Migration Strategy

The migration will follow a component-first approach:

1. **Setup Expo project** with the correct folder structure
2. **Migrate core UI components** from React to React Native
3. **Implement navigation** using Expo Router
4. **Port state management** to the new project
5. **Connect backend** (data persistence, authentication)
6. **Implement platform-specific features**
7. **Comprehensive testing** and refinement

## Project Structure

### Current Structure

```
src/
├── components/
│   ├── Layout.tsx
│   ├── RecipeCard.tsx
│   ├── ExtractorProgress.tsx
│   └── ...
├── context/
│   ├── RecipeContext.tsx
│   ├── CupboardContext.tsx
│   └── ...
├── pages/
│   ├── Index.tsx
│   ├── RecipesPage.tsx
│   └── ...
├── types/
│   └── index.ts
└── ...
```

### Expo Structure

```
app/
├── (tabs)/
│   ├── index.tsx
│   ├── recipes.tsx
│   ├── meal-plan.tsx
│   ├── shopping-list.tsx
│   └── _layout.tsx
├── recipe/
│   ├── [id].tsx
│   └── _layout.tsx
├── add-recipe.tsx
├── profile.tsx
├── _layout.tsx
├── components/
│   ├── RecipeCard.tsx
│   ├── RecipeList.tsx
│   └── ...
├── context/
│   ├── RecipeContext.tsx
│   ├── CupboardContext.tsx
│   └── ...
├── types/
│   └── index.ts
└── ...
```

## Setup Process

### Initial Setup

1. Install Expo CLI and create a new project:

```bash
# Install Expo CLI
npm install -g expo-cli

# Create new project
npx create-expo-app recipe-saver-expo --template blank-typescript

# Navigate to project directory
cd recipe-saver-expo

# Install Expo Router for navigation
npm install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants
```

2. Set up basic project structure:

```bash
# Create app directory and other required directories
mkdir -p app/(tabs) app/recipe app/components app/context app/types
```

3. Update `package.json` with required scripts:

```json
"scripts": {
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web"
}
```

4. Configure `app.json` for your app:

```json
{
  "expo": {
    "name": "Recipe Saver",
    "slug": "recipe-saver",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.recipesaver"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.yourcompany.recipesaver"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

## Component Migration Guide

### General Rules for Component Migration

1. Replace HTML tags with React Native components:

   - `<div>` → `<View>`
   - `<span>` → `<Text>`
   - `<p>` → `<Text>`
   - `<img>` → `<Image>`
   - `<button>` → `<Pressable>` or `<TouchableOpacity>`
   - `<input>` → `<TextInput>`

2. Replace CSS styling with StyleSheet:

   - Convert TailwindCSS classes to StyleSheet objects
   - Use `flexDirection: "row"` instead of flex classes
   - Use numeric values for sizes (no px, rem, etc.)

3. Replace event handlers:
   - `onClick` → `onPress`
   - `onChange` → `onChangeText` for text inputs

### Example Component Migration: RecipeCard

**Original Web Component:**

```tsx
// src/components/RecipeCard.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Heart, Clock } from "lucide-react";

interface RecipeCardProps {
  recipe: Recipe;
  selectedTag?: string;
  onMouseEnter?: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  selectedTag = "",
  onMouseEnter,
}) => {
  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className="block rounded-lg overflow-hidden h-full"
      onMouseEnter={onMouseEnter}
    >
      <div className="relative aspect-square">
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-2 left-2 right-2 text-white">
          <h3 className="font-medium text-sm line-clamp-2">{recipe.title}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {recipe.prepTime + recipe.cookTime} min
            </span>
            {recipe.favorite && (
              <Heart className="h-3 w-3 text-red-400 fill-red-400" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RecipeCard;
```

**Migrated Expo Component:**

```tsx
// app/components/RecipeCard.tsx
import React from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Recipe } from "../types";

interface RecipeCardProps {
  recipe: Recipe;
  selectedTag?: string;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  selectedTag = "",
}) => {
  return (
    <Link href={`/recipe/${recipe.id}`} asChild>
      <Pressable style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: recipe.imageUrl }}
            style={styles.image}
            defaultSource={require("../assets/placeholder.png")}
          />
          <View style={styles.overlay} />
          <View style={styles.contentContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {recipe.title}
            </Text>
            <View style={styles.footer}>
              <View style={styles.timeContainer}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color="white"
                  style={styles.icon}
                />
                <Text style={styles.timeText}>
                  {recipe.prepTime + recipe.cookTime} min
                </Text>
              </View>
              {recipe.favorite && (
                <Ionicons name="heart" size={12} color="#F87171" />
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: "hidden",
    flex: 1,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    aspectRatio: 1,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    backgroundGradient: {
      colors: ["transparent", "rgba(0,0,0,0.6)"],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    },
  },
  contentContainer: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
  },
  title: {
    fontWeight: "500",
    fontSize: 14,
    color: "white",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 4,
  },
  timeText: {
    fontSize: 12,
    color: "white",
  },
});

export default RecipeCard;
```

## Navigation Changes

### From React Router to Expo Router

React Router routes are defined programmatically, while Expo Router uses a file-based routing approach similar to Next.js.

1. Setup the basic tab navigation in `app/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#8AB39F",
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: "Recipes",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "book" : "book-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: "Plan",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping-list"
        options={{
          title: "Shopping",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "cart" : "cart-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
```

2. Create the root layout in `app/_layout.tsx`:

```tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { RecipeProvider } from "./context/RecipeContext";
import { CupboardProvider } from "./context/CupboardContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RecipeProvider>
        <CupboardProvider>
          <StatusBar style="dark" />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="recipe/[id]"
              options={{
                headerTitle: "Recipe Details",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="add-recipe"
              options={{
                headerTitle: "Add Recipe",
                presentation: "modal",
              }}
            />
          </Stack>
        </CupboardProvider>
      </RecipeProvider>
    </SafeAreaProvider>
  );
}
```

## Styling Migration

### From TailwindCSS to React Native StyleSheet

The biggest change in styling is moving from TailwindCSS classes to React Native's StyleSheet system.

**Key Differences:**

1. Style properties use camelCase instead of kebab-case
2. All dimension values are unitless numbers (density-independent pixels)
3. Styles are defined as JavaScript objects

**Example Transformation:**

TailwindCSS:

```jsx
<div className="flex flex-col items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-gray-800">Recipe Title</h2>
  <p className="text-sm text-gray-600">Recipe description</p>
</div>
```

React Native StyleSheet:

```jsx
<View style={styles.container}>
  <Text style={styles.title}>Recipe Title</Text>
  <Text style={styles.description}>Recipe description</Text>
</View>;

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  description: {
    fontSize: 14,
    color: "#4B5563",
  },
});
```

### Using React Native Shadow Properties

```jsx
// In web
<div className="shadow-lg">...</div>

// In React Native
<View style={{
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 5,
  elevation: 5, // For Android
}}>
  ...
</View>
```

## State Management

Your state management approach using Context API can remain similar, with adjustments for React Native:

1. Keep the same context structure and hooks pattern
2. Update storage mechanisms (AsyncStorage instead of localStorage)
3. Modify UI-related state for React Native components

### Example Context Migration:

**Original RecipeContext:**

```tsx
import React, { createContext, useState, useContext, useEffect } from "react";
import { Recipe } from "../types";

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: Recipe) => void;
  // Other functions...
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    // Load from localStorage
    const savedRecipes = localStorage.getItem("recipes");
    if (savedRecipes) {
      setRecipes(JSON.parse(savedRecipes));
    }
  }, []);

  // Save to localStorage whenever recipes change
  useEffect(() => {
    localStorage.setItem("recipes", JSON.stringify(recipes));
  }, [recipes]);

  // Other functions...

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        addRecipe,
        // Other functions...
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error("useRecipes must be used within a RecipeProvider");
  }
  return context;
};
```

**Migrated RecipeContext:**

```tsx
import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Recipe } from "../types";

interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: Recipe) => void;
  // Other functions...
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load from AsyncStorage
    const loadRecipes = async () => {
      try {
        const savedRecipes = await AsyncStorage.getItem("recipes");
        if (savedRecipes) {
          setRecipes(JSON.parse(savedRecipes));
        }
      } catch (error) {
        console.error("Failed to load recipes", error);
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, []);

  // Save to AsyncStorage whenever recipes change
  useEffect(() => {
    const saveRecipes = async () => {
      try {
        await AsyncStorage.setItem("recipes", JSON.stringify(recipes));
      } catch (error) {
        console.error("Failed to save recipes", error);
      }
    };

    if (!loading) {
      saveRecipes();
    }
  }, [recipes, loading]);

  // Other functions...

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        addRecipe,
        // Other functions...
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error("useRecipes must be used within a RecipeProvider");
  }
  return context;
};
```

## Platform-Specific Features

For platform-specific capabilities, Expo provides a uniform API across platforms:

### Camera Access

```tsx
import { Camera } from "expo-camera";
import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";

export default function CameraComponent() {
  const [hasPermission, setHasPermission] = useState(null);
  const [camera, setCamera] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const takePicture = async () => {
    if (camera) {
      const photo = await camera.takePictureAsync();
      console.log(photo);
      // Process photo...
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={(ref) => setCamera(ref)}
        style={{ flex: 1 }}
        type={Camera.Constants.Type.back}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", margin: 20 }}>
          <TouchableOpacity
            style={{
              alignSelf: "center",
              alignItems: "center",
              backgroundColor: "white",
              borderRadius: 50,
              height: 70,
              width: 70,
              marginBottom: 20,
            }}
            onPress={takePicture}
          />
        </View>
      </Camera>
    </View>
  );
}
```

### File System Access

```tsx
import * as FileSystem from "expo-file-system";

// Save a file
const saveFile = async (fileUri, content) => {
  try {
    await FileSystem.writeAsStringAsync(fileUri, content);
    console.log("File saved successfully");
  } catch (error) {
    console.error("Error saving file:", error);
  }
};

// Read a file
const readFile = async (fileUri) => {
  try {
    const content = await FileSystem.readAsStringAsync(fileUri);
    return content;
  } catch (error) {
    console.error("Error reading file:", error);
    return null;
  }
};
```

## Backend Integration

### API Calls

API calls remain largely the same, using fetch or libraries like axios:

```tsx
import { useEffect, useState } from "react";

export const useRecipeAPI = (recipeId) => {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://api.yourbackend.com/recipes/${recipeId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch recipe");
        }

        const data = await response.json();
        setRecipe(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId]);

  return { recipe, loading, error };
};
```

### Persistent Storage

Replace localStorage with AsyncStorage:

```tsx
import AsyncStorage from "@react-native-async-storage/async-storage";

// Save data
const storeData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error("Error storing data", e);
  }
};

// Load data
const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error("Error retrieving data", e);
    return null;
  }
};
```

## Testing Strategy

1. **Component Testing**: Test individual components with React Native Testing Library
2. **Integration Testing**: Test navigation flows and state management
3. **Device Testing**: Test on multiple iOS and Android devices

```javascript
// Install testing libraries
npm install --save-dev @testing-library/react-native jest-expo

// Example component test
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RecipeCard from '../components/RecipeCard';

describe('RecipeCard', () => {
  const mockRecipe = {
    id: '1',
    title: 'Test Recipe',
    imageUrl: 'https://example.com/image.jpg',
    prepTime: 10,
    cookTime: 20,
    favorite: true,
  };

  it('renders correctly', () => {
    const { getByText } = render(<RecipeCard recipe={mockRecipe} />);

    expect(getByText('Test Recipe')).toBeTruthy();
    expect(getByText('30 min')).toBeTruthy();
  });
});
```

## Migration Timeline

### Week 1: Project Setup & Core Components

- Set up Expo project structure
- Migrate basic UI components (RecipeCard, etc.)
- Establish styling conventions

### Week 2: Navigation & Layout

- Implement Expo Router navigation
- Create tab navigation
- Migrate screen layouts

### Week 3: State Management

- Migrate context providers
- Implement AsyncStorage for persistence
- Connect state to components

### Week 4: Features & Platform Integration

- Implement camera and file access
- Add sharing features
- Implement push notifications

### Week 5: Polish & Testing

- UI refinement
- Accessibility improvements
- Cross-platform testing
- Bug fixes

### Week 6: Final Testing & Launch

- Performance optimization
- App Store preparation
- Documentation

## Troubleshooting

### Common Issues

1. **Style Differences**: React Native styling differs significantly from web CSS

   - Solution: Use platform-specific styling instead of direct CSS translations

2. **Navigation Behavior**: Expo Router navigation patterns are different

   - Solution: Review Expo Router documentation and adapt patterns

3. **Image Loading**: Images need to be properly processed

   - Solution: Use proper image loading techniques for React Native

4. **Performance Issues**: React Native performance optimization is different

   - Solution: Use memo, useMemo, useCallback hooks appropriately

5. **Platform Inconsistencies**: iOS and Android may render differently
   - Solution: Use Platform.OS checks and conditional styling

### Quick Fixes

```tsx
// Platform-specific code
import { Platform, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
```

## Files to Keep/Modify/Delete

### Keep (with modifications)

- **All business logic**: Recipe data structures, filtering logic
- **Context providers**: State management approach
- **Type definitions**: Data models and interfaces

### Modify

- **UI Components**: Convert from web to React Native
- **Navigation**: Switch from React Router to Expo Router
- **Styling**: Switch from TailwindCSS to StyleSheet
- **Storage**: Switch from localStorage to AsyncStorage

### Delete

- **Capacitor configuration files**: capacitor.config.ts, etc.
- **Web-specific styling**: CSS/SCSS files
- **Web infrastructure**: index.html, public folder
- **React Router configuration**: router.tsx

## Conclusion

Migrating from Capacitor to Expo offers several advantages:

- Better cross-platform consistency
- More streamlined mobile development workflow
- Access to Expo's extensive library ecosystem
- Simplified deployment and updates

By following this migration guide, you can efficiently transform your web-first app into a fully native mobile experience while preserving your business logic and application structure.
