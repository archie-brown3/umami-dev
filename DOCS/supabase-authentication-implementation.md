# Supabase Authentication Implementation Guide

This technical guide provides step-by-step instructions for implementing Supabase authentication in the Recipe App, including protected routes and dynamic recipe loading from the user's account.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Setup and Configuration](#setup-and-configuration)
4. [Authentication Flow Implementation](#authentication-flow-implementation)
5. [Protected Routes](#protected-routes)
6. [Recipe Data Integration](#recipe-data-integration)
7. [UI Implementation](#ui-implementation)
8. [Testing and Troubleshooting](#testing-and-troubleshooting)

## Overview

This implementation will:

- Use Supabase for user authentication and data storage
- Protect all app routes to require authentication
- Dynamically load recipes from the user's Supabase account
- Follow Expo and React Native best practices

## Prerequisites

- Expo SDK 49 or newer
- Supabase account and project set up
- Database schema implemented according to `database-schema.md`
- Row Level Security (RLS) policies configured in Supabase

## Setup and Configuration

### 1. Install Required Dependencies

```bash
# Supabase and authentication
npm install @supabase/supabase-js
npm install react-native-url-polyfill
npm install @react-native-async-storage/async-storage

# UI components (optional)
npm install react-native-elements
```

### 2. Initialize Supabase Client

Create `lib/supabase.ts`:

```typescript
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Environment variables should be loaded from a secure config
// For development, you can use expo-constants or a .env file
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### 3. Environment Variables Setup

Create an `.env` file (add to .gitignore) for development:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For production, configure environment variables in your CI/CD pipeline or Expo's build system.

## Authentication Flow Implementation

### 1. Create Authentication Context

Create `context/AuthContext.tsx`:

```typescript
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://yourappdomain.com/reset-password",
    });
    return { error };
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

### 2. Add Authentication Provider to App

Update `app/_layout.tsx`:

```typescript
import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";

// Check if the user is authenticated
function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Check if the user is authenticated
    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      // Redirect to the login page if not authenticated
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      // Redirect to the home page if authenticated and on an auth page
      router.replace("/(tabs)");
    }
  }, [session, loading, segments]);

  return (
    <Stack>
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
      <Stack.Screen
        name="(auth)/forgot-password"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
```

## Protected Routes

### 1. Create Authentication Screens

Create `app/(auth)/login.tsx`:

```typescript
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Link } from "expo-router";
import { colors, spacing } from "../../utils/styleUtils";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Recipe App</Text>
        <Text style={styles.subtitle}>Log in to your account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in..." : "Log In"}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <Link href="/(auth)/forgot-password" asChild>
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.link}>Forgot Password?</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  formContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: spacing.sm,
    color: colors.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[500],
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  input: {
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  footerText: {
    color: colors.gray[500],
  },
  link: {
    color: colors.primary,
    fontWeight: "600",
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: spacing.md,
  },
});
```

Create similar screens for:

- `app/(auth)/register.tsx`
- `app/(auth)/forgot-password.tsx`

### 2. Update Existing Tab Layout

Update `app/(tabs)/_layout.tsx` to include authentication checks:

```typescript
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

export default function TabLayout() {
  const { user } = useAuth();

  // You might want to handle this differently,
  // but this is a simple check to ensure authentication
  if (!user) {
    return null; // The RootLayout will redirect to login
  }

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: "My Recipes",
          tabBarIcon: ({ color }) => (
            <Ionicons name="restaurant" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

## Recipe Data Integration

### 1. Create Type Definitions

Create `types/database.types.ts`:

```typescript
export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  category: string | null;
  source: string | null;
  source_url: string | null;
  author: string | null;
  is_favorite: boolean;
  is_saved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  id: string;
  name: string;
  category: string | null;
  emoji: string | null;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: string;
  unit: string;
  ingredient?: Ingredient;
}

export interface Step {
  id: string;
  recipe_id: string;
  description: string;
  order_index: number;
}

export interface Tag {
  id: string;
  name: string;
}

export interface RecipeTag {
  recipe_id: string;
  tag_id: string;
  tag?: Tag;
}

// Frontend representation
export interface RecipeWithDetails {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  category: string | null;
  source: string | null;
  sourceUrl: string | null;
  author: string | null;
  isFavorite: boolean;
  isSaved: boolean;
  createdAt: Date;
  updatedAt: Date;
  ingredients: Array<{
    id: string;
    name: string;
    quantity: string;
    unit: string;
    category?: string;
    emoji?: string;
  }>;
  steps: Array<{
    description: string;
    orderIndex: number;
  }>;
  tags: string[];
}
```

### 2. Create Recipe Services

Create `services/recipeService.ts`:

```typescript
import { supabase } from "../lib/supabase";
import {
  Recipe,
  RecipeWithDetails,
  RecipeIngredient,
  Step,
  RecipeTag,
} from "../types/database.types";

// Fetch a user's recipes
export async function getUserRecipes(userId: string) {
  try {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data as Recipe[];
  } catch (error) {
    console.error("Error fetching recipes:", error);
    throw error;
  }
}

// Get a single recipe with all related data
export async function getRecipeWithDetails(
  recipeId: string
): Promise<RecipeWithDetails | null> {
  try {
    // Fetch the recipe
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", recipeId)
      .single();

    if (recipeError) throw recipeError;
    if (!recipe) return null;

    // Fetch ingredients with their details
    const { data: recipeIngredients, error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .select(
        `
        *,
        ingredient:ingredients(*)
      `
      )
      .eq("recipe_id", recipeId);

    if (ingredientsError) throw ingredientsError;

    // Fetch steps
    const { data: steps, error: stepsError } = await supabase
      .from("steps")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("order_index", { ascending: true });

    if (stepsError) throw stepsError;

    // Fetch tags
    const { data: recipeTags, error: tagsError } = await supabase
      .from("recipe_tags")
      .select(
        `
        *,
        tag:tags(*)
      `
      )
      .eq("recipe_id", recipeId);

    if (tagsError) throw tagsError;

    // Transform to frontend model
    return transformRecipe(
      recipe,
      recipeIngredients as RecipeIngredient[],
      steps as Step[],
      recipeTags as RecipeTag[]
    );
  } catch (error) {
    console.error("Error fetching recipe details:", error);
    throw error;
  }
}

// Transform database model to frontend model
function transformRecipe(
  recipe: Recipe,
  recipeIngredients: RecipeIngredient[],
  steps: Step[],
  recipeTags: RecipeTag[]
): RecipeWithDetails {
  return {
    id: recipe.id,
    userId: recipe.user_id,
    title: recipe.title,
    description: recipe.description,
    imageUrl: recipe.image_url,
    prepTime: recipe.prep_time,
    cookTime: recipe.cook_time,
    servings: recipe.servings,
    category: recipe.category,
    source: recipe.source,
    sourceUrl: recipe.source_url,
    author: recipe.author,
    isFavorite: recipe.is_favorite,
    isSaved: recipe.is_saved,
    createdAt: new Date(recipe.created_at),
    updatedAt: new Date(recipe.updated_at),
    ingredients: recipeIngredients.map((ri) => ({
      id: ri.id,
      name: ri.ingredient?.name || "Unknown",
      quantity: ri.quantity,
      unit: ri.unit,
      category: ri.ingredient?.category || undefined,
      emoji: ri.ingredient?.emoji || undefined,
    })),
    steps: steps.map((step) => ({
      description: step.description,
      orderIndex: step.order_index,
    })),
    tags: recipeTags.map((rt) => rt.tag?.name || ""),
  };
}

// Create a new recipe
export async function createRecipe(
  recipe: Partial<RecipeWithDetails>,
  userId: string
) {
  // Implementation details would go here
  // This would involve inserting the recipe and related data
}

// Update a recipe
export async function updateRecipe(recipe: Partial<RecipeWithDetails>) {
  // Implementation details would go here
}

// Delete a recipe
export async function deleteRecipe(recipeId: string) {
  // Implementation details would go here
}
```

!!!Completed up to this step!!!

### 3. Update Recipe Screens to Use Supabase Data

Update `app/(tabs)/recipes.tsx`:

```typescript
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { getUserRecipes } from "../../services/recipeService";
import { Recipe } from "../../types/database.types";
import RecipeCard from "../../components/RecipeCard";

export default function RecipesScreen() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecipes() {
      if (!user) return;

      try {
        setLoading(true);
        const data = await getUserRecipes(user.id);
        setRecipes(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load recipes:", err);
        setError("Failed to load recipes. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadRecipes();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (recipes.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>You don't have any recipes yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={recipes}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <RecipeCard recipe={item} />}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
  list: {
    padding: 16,
  },
});
```

## UI Implementation

### 1. Create Profile Screen

Create `app/(tabs)/profile.tsx` with logout functionality:

```typescript
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { colors, spacing } from "../../utils/styleUtils";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert("Error", "Failed to sign out");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={colors.white} />
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons
            name="settings-outline"
            size={24}
            color={colors.gray[700]}
          />
          <Text style={styles.menuItemText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="heart-outline" size={24} color={colors.gray[700]} />
          <Text style={styles.menuItemText}>Favorites</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons
            name="help-circle-outline"
            size={24}
            color={colors.gray[700]}
          />
          <Text style={styles.menuItemText}>Help & Support</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.lg,
  },
  profileHeader: {
    alignItems: "center",
    marginVertical: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  email: {
    fontSize: 16,
    color: colors.gray[700],
  },
  section: {
    marginBottom: spacing.xl,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  menuItemText: {
    marginLeft: spacing.md,
    fontSize: 16,
    color: colors.gray[700],
  },
  signOutButton: {
    backgroundColor: colors.gray[200],
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    marginTop: "auto",
  },
  signOutText: {
    color: colors.gray[700],
    fontSize: 16,
    fontWeight: "600",
  },
});
```

## Testing and Troubleshooting

### 1. Authentication Testing Checklist

- [ ] User can register with email and password
- [ ] User can log in with correct credentials
- [ ] User cannot access protected routes when not authenticated
- [ ] User is redirected to login page when not authenticated
- [ ] User is redirected to home page after successful login
- [ ] User can log out
- [ ] Session persists across app restarts
- [ ] Protected API calls include authorization

### 2. Common Issues and Solutions

1. **Network Errors with Supabase**

   - Check network connectivity
   - Verify API keys and URLs
   - Add better error handling and retry logic

2. **Authentication State Issues**

   - Use the Supabase auth debug tools
   - Check for session expiration handling
   - Verify storage permissions for AsyncStorage

3. **Recipe Loading Problems**
   - Add logging to track API call flow
   - Verify Row Level Security (RLS) policies
   - Check database permissions

### 3. Security Best Practices

1. **Secure Storage**

   - Never store API keys in client code
   - Use environment variables
   - Consider obfuscation for sensitive data

2. **Input Validation**

   - Validate all user inputs
   - Sanitize data before sending to Supabase
   - Implement proper error messages

3. **Session Management**
   - Implement token refresh mechanisms
   - Add session timeout handling
   - Secure token storage using AsyncStorage

## Conclusion

This implementation guide provides a comprehensive approach to integrating Supabase authentication and database functionality with your Expo Recipe App. By following these steps, you can create a secure, user-specific experience that dynamically loads recipe data from Supabase according to the defined database schema.

For more details on Supabase configuration, refer to the Supabase documentation and the database schema defined in `database-schema.md`.
