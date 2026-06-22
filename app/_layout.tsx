import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { useColorScheme } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { RecipeProvider } from "@/context/RecipeContext";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { GroceriesProvider } from "@/context/GroceriesContext";
import { MealPlanProvider } from "@/context/MealPlanContext";
import { initializeRevenueCat } from "@/lib/revenuecat";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutWithProviders />;
}

function RootLayoutWithProviders() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    initializeRevenueCat().catch((err) =>
      console.error("[RootLayout] Failed to initialize RevenueCat:", err)
    );
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RecipeProvider>
        <SubscriptionProvider>
          <MealPlanProvider>
            <GroceriesProvider>
              <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
              >
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="recipe/[id]"
                    options={{
                      headerShown: true,
                      headerTitle: "Recipe Details",
                      presentation: "card",
                    }}
                  />
                  <Stack.Screen
                    name="recipe/edit/[id]"
                    options={{
                      headerShown: false,
                      presentation: "modal",
                      animation: "slide_from_bottom",
                      gestureEnabled: false,
                    }}
                  />
                  <Stack.Screen
                    name="recipe/create"
                    options={{
                      headerShown: false,
                      presentation: "modal",
                      animation: "slide_from_bottom",
                      gestureEnabled: false,
                    }}
                  />
                  <Stack.Screen
                    name="profile"
                    options={{
                      headerShown: true,
                      headerTitle: "Profile",
                      headerBackTitle: "Home",
                      presentation: "card",
                    }}
                  />
                  <Stack.Screen
                    name="add-recipe"
                    options={{
                      headerShown: false,
                      presentation: "modal",
                      animation: "slide_from_bottom",
                    }}
                  />
                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
            </GroceriesProvider>
          </MealPlanProvider>
        </SubscriptionProvider>
      </RecipeProvider>
    </GestureHandlerRootView>
  );
}
