import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// Define types
interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    console.log("[AuthContext] Initializing authentication...");

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn(
        "[AuthContext] Supabase not configured, disabling authentication"
      );
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("[AuthContext] Error getting initial session:", error);
      } else {
        console.log(
          "[AuthContext] Initial session:",
          session ? "Found" : "None"
        );
      }

      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(
        "[AuthContext] Auth state changed:",
        event,
        session ? "Session exists" : "No session"
      );

      setSession(session);
      setUser(session?.user ?? null);

      // Only set loading to false for auth state changes, not during manual operations
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED"
      ) {
        setIsLoading(false);
      }
    });

    return () => {
      console.log("[AuthContext] Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return {
        error: {
          message:
            "Authentication service not available. Please try again later.",
        },
      };
    }

    try {
      console.log("[AuthContext] Attempting to sign in...");
      setIsLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[AuthContext] Sign in error:", error);
        setIsLoading(false); // Reset loading on error
      }

      // Don't set loading to false here - let onAuthStateChange handle it
      return { error };
    } catch (error) {
      console.error("[AuthContext] Sign in exception:", error);
      setIsLoading(false);
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return {
        error: {
          message:
            "Authentication service not available. Please try again later.",
        },
      };
    }

    try {
      console.log("[AuthContext] Attempting to sign up...");
      setIsLoading(true);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Use proper redirect URLs for TestFlight/production
          emailRedirectTo: "umami-dev://auth/callback",
        },
      });

      if (error) {
        console.error("[AuthContext] Sign up error:", error);
      } else {
        console.log(
          "[AuthContext] Sign up successful - check email for verification"
        );
      }

      setIsLoading(false);
      return { error };
    } catch (error) {
      console.error("[AuthContext] Sign up exception:", error);
      setIsLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      return;
    }

    try {
      console.log("[AuthContext] Signing out...");
      setIsLoading(true);
      await supabase.auth.signOut();
      // onAuthStateChange will handle setting loading to false
    } catch (error) {
      console.error("[AuthContext] Sign out error:", error);
      setIsLoading(false);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured()) {
      return {
        error: {
          message:
            "Authentication service not available. Please try again later.",
        },
      };
    }

    try {
      console.log("[AuthContext] Resetting password for:", email);
      setIsLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "umami-dev://auth/callback",
      });

      setIsLoading(false);
      return { error };
    } catch (error) {
      console.error("[AuthContext] Reset password error:", error);
      setIsLoading(false);
      return { error };
    }
  };

  // Log current auth state for debugging
  useEffect(() => {
    console.log("[AuthContext] Current state:", {
      hasSession: !!session,
      hasUser: !!user,
      isLoading,
      userId: user?.id?.substring(0, 8) + "...",
    });
  }, [session, user, isLoading]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Default export to satisfy Expo Router
export default { AuthProvider, useAuth };
