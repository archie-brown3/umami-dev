import { Stack } from "expo-router";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  NavigationContainer,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { RecipeProvider } from "./context/RecipeContext";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RecipeProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="recipe/[id]"
              options={{
                headerShown: true,
                headerTitle: "Recipe Details",
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
      </RecipeProvider>
    </GestureHandlerRootView>
  );
}
