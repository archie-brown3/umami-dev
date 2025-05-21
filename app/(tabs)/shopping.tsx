import { useEffect } from "react";
import { router } from "expo-router";

export default function ShoppingRedirect() {
  useEffect(() => {
    // Redirect to the groceries tab with shopping list view
    router.replace("/(tabs)/groceries");
  }, []);

  return null;
}
