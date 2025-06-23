import "react-native-url-polyfill/auto";
// AsyncStorage will be conditionally assigned later.
// import AsyncStorage from "@react-native-async-storage/async-storage"; // REMOVED TOP-LEVEL IMPORT
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import type {
  AuthChangeEvent,
  Session,
  SupportedStorage,
} from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// For TestFlight builds, we'll use default values if environment variables are missing
// This prevents the app from crashing in production while still working when properly configured
const defaultSupabaseUrl = "https://placeholder.supabase.co";
const defaultSupabaseKey = "placeholder-key";

const finalSupabaseUrl = supabaseUrl || defaultSupabaseUrl;
const finalSupabaseKey = supabaseAnonKey || defaultSupabaseKey;

// Check if we're using placeholder values and warn in development
if (!supabaseUrl || !supabaseAnonKey) {
  if (__DEV__) {
    console.warn(
      "[Supabase] Missing environment variables. Using placeholder values. Authentication will not work until properly configured."
    );
    console.warn(
      "[Supabase] Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your environment variables."
    );
  } else {
    // In production (TestFlight), log that authentication is disabled
    console.log(
      "[Supabase] Environment variables not configured. Authentication features disabled."
    );
  }
}

// For debugging purposes, log a masked version of the URL (not the key)
const maskedUrl = finalSupabaseUrl.replace(/^(https?:\/\/[^.]+)(.*)$/, "$1...");
console.log("[Supabase] Connecting to URL:", maskedUrl);

let storageAdapter: SupportedStorage;

if (Platform.OS === "web" && typeof window !== "undefined") {
  console.log("[Supabase] Using localStorage for web platform");
  storageAdapter = {
    setItem: (key: string, value: string) => {
      window.localStorage.setItem(key, value);
    },
    getItem: (key: string) => {
      return window.localStorage.getItem(key);
    },
    removeItem: (key: string) => {
      window.localStorage.removeItem(key);
    },
  };
} else {
  console.log("[Supabase] Using AsyncStorage for native platform");
  const AsyncStoragePackage = require("@react-native-async-storage/async-storage");
  storageAdapter = AsyncStoragePackage.default || AsyncStoragePackage;
}

// Configure client with more detailed error handling and retries
export const supabase = createClient(finalSupabaseUrl, finalSupabaseKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    debug: __DEV__, // Only enable debug in development
  },
  global: {
    headers: {
      "X-Client-Info": `UmamiApp/${Platform.OS} @${
        process.env.EXPO_PUBLIC_APP_VERSION || "1.0.0"
      }`,
    },
  },
  db: {
    schema: "public",
  },
  realtime: {
    timeout: 30000,
  },
});

// Export helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Export configuration status for debugging
export const supabaseConfig = {
  isConfigured: isSupabaseConfigured(),
  url: maskedUrl,
  hasValidUrl: finalSupabaseUrl !== defaultSupabaseUrl,
  hasValidKey: finalSupabaseKey !== defaultSupabaseKey,
};

// Helper function to check if Supabase connection is available
export const checkSupabaseConnection = async () => {
  try {
    console.log("Testing Supabase connection...");
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("No authenticated user found");
      return false;
    }

    // Simple query to check connection
    const startTime = Date.now();
    const { data, error } = await supabase
      .from("recipes")
      .select("count", { count: "exact", head: true })
      .eq("user_id", user.id);

    const duration = Date.now() - startTime;
    if (error) {
      console.error(`Supabase connection failed after ${duration}ms:`, error);
      return false;
    }

    console.log(`Supabase connection successful (${duration}ms)`);
    return true;
  } catch (e) {
    console.error("Supabase connection check exception:", e);
    return false;
  }
};

// Add a function to get the current session
export const getCurrentSession = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      console.error("Error getting session:", error.message);
      return null;
    }
    return session;
  } catch (e) {
    console.error("Exception getting session:", e);
    return null;
  }
};

// Add a function to test network connectivity more broadly
export const testNetworkConnectivity = async () => {
  try {
    console.log("Testing general network connectivity...");
    const startTime = Date.now();
    // Try to fetch a known reliable endpoint
    const response = await fetch("https://httpbin.org/get");
    const duration = Date.now() - startTime;

    if (response.ok) {
      console.log(`Network test successful (${duration}ms)`);
      return true;
    } else {
      console.error(
        `Network test failed with status ${response.status} after ${duration}ms`
      );
      return false;
    }
  } catch (e) {
    console.error("Network connectivity test exception:", e);
    return false;
  }
};
