import { useEffect } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Check if we have a session
      if (session) {
        console.log("OAuth callback: Session found, redirecting to app");
        router.replace("/(tabs)");
      } else {
        console.log("OAuth callback: No session found, redirecting to login");
        router.replace("/(auth)/login");
      }
    });
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Completing sign in...</Text>
    </View>
  );
}
