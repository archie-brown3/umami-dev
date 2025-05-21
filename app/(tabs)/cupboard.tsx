import { useEffect } from "react";
import { router } from "expo-router";

export default function CupboardRedirect() {
  useEffect(() => {
    // Redirect to the groceries tab with cupboard view
    router.replace("/(tabs)/groceries");
  }, []);

  return null;
}
