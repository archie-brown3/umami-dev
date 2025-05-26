import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
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
import { GroceriesProvider } from "@/context/GroceriesContext";
import { ConnectionDiagnostic } from "@/components/ConnectionDiagnostic";
import Constants from "expo-constants";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Check if we're in tunnel mode (exp.direct domain)
const isTunnelMode =
  Constants.expoConfig?.hostUri?.includes("exp.direct") ||
  Constants.experienceUrl?.includes("exp.direct");

// Root navigation component with auth protection
function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [authError, setAuthError] = useState<Error | null>(null);

  useEffect(() => {
    if (isLoading) return;

    // Check if the user is authenticated
    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      // Redirect to the login page if not authenticated
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      // Redirect to the home page if authenticated and on an auth page
      router.replace("/(tabs)");
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Recipe Detail Screen */}
        <Stack.Screen
          name="recipe/[id]"
          options={{
            headerShown: true,
            headerTitle: "Recipe Details",
            presentation: "card",
          }}
        />

        {/* Recipe Edit Screen */}
        <Stack.Screen
          name="recipe/edit/[id]"
          options={{
            headerShown: false,
            presentation: "modal",
            animation: "slide_from_bottom",
            gestureEnabled: false, // Prevent accidental dismissal
          }}
        />

        {/* Recipe Create Screen */}
        <Stack.Screen
          name="recipe/create"
          options={{
            headerShown: false,
            presentation: "modal",
            animation: "slide_from_bottom",
            gestureEnabled: false, // Prevent accidental dismissal
          }}
        />

        <Stack.Screen
          name="profile"
          options={{
            headerShown: true,
            headerTitle: "Profile",
            presentation: "card",
          }}
        />

        {/* Legacy Add Recipe Screen (keep for backward compatibility) */}
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
      {/* Show the connection diagnostic tool when in tunnel mode */}
      {isTunnelMode && <ConnectionDiagnostic />}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [layoutError, setLayoutError] = useState<Error | null>(null);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch((error) => {
        console.error("Error hiding splash screen:", error);
      });
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // Error fallback
  if (layoutError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ color: "red", fontSize: 18, marginBottom: 10 }}>
          Application Error
        </Text>
        <Text style={{ textAlign: "center" }}>{layoutError.message}</Text>
      </View>
    );
  }

  try {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <RecipeProvider>
            <GroceriesProvider>
              <RootLayoutNav />
            </GroceriesProvider>
          </RecipeProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    );
  } catch (error) {
    console.error("Root layout error:", error);
    setLayoutError(error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}
