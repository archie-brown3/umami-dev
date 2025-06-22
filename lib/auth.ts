import { Platform } from "react-native";
import { supabase } from "./supabase";

// Auth configuration
export const AUTH_CONFIG = {
  redirectTo: Platform.select({
    ios: "umami-dev://auth/callback",
    android: "umami-dev://auth/callback",
    default: "http://localhost:3000/auth/callback",
  }),
  scopes: "name email",
};

// Helper function to handle auth errors
export const handleAuthError = (error: any) => {
  console.error("[Auth Error]", error);

  // Common auth error messages
  const errorMessages: { [key: string]: string } = {
    "database error saving new user":
      "Failed to create user profile. This usually means the database is not properly configured. Please contact support.",
    "User already registered": "An account with this email already exists.",
    "Invalid login credentials": "Invalid email or password.",
  };

  return (
    errorMessages[error.message] || error.message || "An unknown error occurred"
  );
};

// Initialize auth listeners
export const initializeAuth = () => {
  // Listen for auth state changes
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("[Auth] Event:", event, "User:", session?.user?.id);

    if (event === "SIGNED_IN") {
      console.log("[Auth] User signed in:", session?.user?.email);

      // Check if profile exists
      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profileError || !profile) {
          console.log(
            "[Auth] Creating missing profile for user:",
            session.user.id
          );
          const { error: insertError } = await supabase
            .from("profiles")
            .insert([
              {
                id: session.user.id,
                email: session.user.email,
                display_name: session.user.user_metadata?.full_name,
              },
            ]);

          if (insertError) {
            console.error("[Auth] Error creating profile:", insertError);
          }
        }
      }
    } else if (event === "SIGNED_OUT") {
      console.log("[Auth] User signed out");
    } else if (event === "USER_UPDATED") {
      console.log("[Auth] User updated:", session?.user?.id);
    }
  });

  return subscription;
};

// Sign in with Apple
export const signInWithApple = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: AUTH_CONFIG.redirectTo,
        scopes: AUTH_CONFIG.scopes,
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("[Apple Auth Error]", error);
    return { data: null, error: handleAuthError(error) };
  }
};

// Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("[Sign Out Error]", error);
    return { error: handleAuthError(error) };
  }
};
