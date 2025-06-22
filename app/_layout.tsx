import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { useColorScheme, Text, View } from "react-native";
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
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { GroceriesProvider } from "@/context/GroceriesContext";
import { MealPlanProvider } from "@/context/MealPlanContext";
import { ConnectionDiagnostic } from "@/components/ConnectionDiagnostic";
import { initializeRevenueCat } from "@/lib/revenuecat";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Check if we're in tunnel mode (exp.direct domain)
const isTunnelMode =
  Constants.expoConfig?.hostUri?.includes("exp.direct") ||
  Constants.experienceUrl?.includes("exp.direct");

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RecipeProvider>
          <SubscriptionProvider>
            <MealPlanProvider>
              <GroceriesProvider>
                <ThemeProvider
                  value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
                >
                  <RootLayoutNav />
                </ThemeProvider>
              </GroceriesProvider>
            </MealPlanProvider>
          </SubscriptionProvider>
        </RecipeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

// Root navigation component with auth protection
function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Initialize RevenueCat SDK on app start
  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        await initializeRevenueCat();
        console.log("[RootLayout] RevenueCat initialized successfully");
      } catch (error) {
        console.error("[RootLayout] Failed to initialize RevenueCat:", error);
      }
    };
    initRevenueCat();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading, segments]);

  useEffect(() => {
    // Handle deep linking for OAuth callback
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event;
      if (url.includes("#access_token") || url.includes("?code=")) {
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              console.log("Deep link callback: Session found, redirecting.");
              router.replace("/(tabs)");
            }
          });
        }, 100);
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
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
        <Stack.Screen
          name="api-test"
          options={{
            headerShown: true,
            headerTitle: "API Connectivity Test",
            presentation: "card",
          }}
        />
      </Stack>
      <StatusBar style="auto" />
      {isTunnelMode && <ConnectionDiagnostic />}
    </>
  );
}
