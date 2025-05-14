import { useEffect } from "react";
import { View, Text } from "react-native";
import { router, useLocalSearchParams, usePathname } from "expo-router";

/**
 * This file exists SOLELY as a landing page for the navbar button.
 * It immediately redirects to the actual add-recipe form with appropriate parameters.
 * This solves the circular problem with tab navigation vs direct navigation.
 */
export default function CreateRecipeRedirect() {
  const params = useLocalSearchParams();
  const previousScreen = usePathname();

  // Default to instagram tab or use whatever was passed
  const tab = params?.tab || "instagram";

  useEffect(() => {
    // Add a slight delay to ensure the navigation completes properly
    const timeout = setTimeout(() => {
      // Use push instead of replace for this redirect
      router.push({
        pathname: "/add-recipe",
        params: {
          tab,
          previousScreen:
            previousScreen !== "/create-recipe" ? previousScreen : "/recipes",
        },
      });
    }, 100);

    return () => clearTimeout(timeout);
  }, [tab, previousScreen]);

  // Render a minimal loading indicator
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Loading recipe form...</Text>
    </View>
  );
}
