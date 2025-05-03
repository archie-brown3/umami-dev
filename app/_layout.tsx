import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { RecipeProvider } from "../context/RecipeContext";
import { CupboardProvider } from "../context/CupboardContext";
import { ShoppingListProvider } from "../context/ShoppingListContext";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";
import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import React from "react";

const queryClient = new QueryClient();

// Auth protection component
function AuthProtection({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;

    // Check if the user is on a protected route
    const inAuthGroup =
      segments[0] === "(tabs)" ||
      segments[0] === "recipe" ||
      segments[0] === "add-recipe" ||
      segments[0] === "profile" ||
      segments[0] === "settings";

    if (!user && inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace("/login");
    } else if (user && segments[0] === "login") {
      // Redirect to home if already authenticated
      router.replace("/");
    }
  }, [user, initialized, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthProtection>
            <RecipeProvider>
              <CupboardProvider>
                <ShoppingListProvider>
                  <StatusBar style="dark" />
                  <Stack>
                    <Stack.Screen
                      name="(tabs)"
                      options={{ headerShown: false }}
                    />
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
                    <Stack.Screen
                      name="profile"
                      options={{
                        headerTitle: "Profile",
                      }}
                    />
                    <Stack.Screen
                      name="settings"
                      options={{
                        headerTitle: "Settings",
                      }}
                    />
                    <Stack.Screen
                      name="login"
                      options={{
                        headerShown: false,
                        presentation: "fullScreenModal",
                      }}
                    />
                  </Stack>
                </ShoppingListProvider>
              </CupboardProvider>
            </RecipeProvider>
          </AuthProtection>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
