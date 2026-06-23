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

// Production configuration - environment variables are required
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL environment variable. Please configure your Supabase project URL."
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable. Please configure your Supabase anonymous key."
  );
}

// Validate URL format
if (
  !supabaseUrl.startsWith("https://") ||
  !supabaseUrl.includes(".supabase.co")
) {
  throw new Error(
    "Invalid EXPO_PUBLIC_SUPABASE_URL format. Expected: https://your-project-id.supabase.co"
  );
}

// Log successful configuration (masked for security)
const maskedUrl = supabaseUrl.replace(/^(https?:\/\/[^.]+)(.*)$/, "$1...");
const maskedKey = supabaseAnonKey.substring(0, 8) + "...";
console.log("[Supabase] Configuration loaded:", {
  url: maskedUrl,
  keyPrefix: maskedKey,
  platform: Platform.OS,
});

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

// Production Supabase client configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
  isConfigured: true, // Always true in production since we throw errors for missing config
  url: maskedUrl,
  platform: Platform.OS,
  version: process.env.EXPO_PUBLIC_APP_VERSION || "1.0.0",
};

// Helper function to check if Supabase connection is available
export const checkSupabaseConnection = async () => {
  try {
    console.log("[Supabase] Testing connection...");
    const startTime = Date.now();

    // Test basic auth endpoint connectivity
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    const duration = Date.now() - startTime;

    if (error && error.message !== "Invalid JWT") {
      console.error(
        `[Supabase] Connection test failed after ${duration}ms:`,
        error
      );
      return false;
    }

    console.log(`[Supabase] Connection test successful (${duration}ms)`);
    return true;
  } catch (e) {
    console.error("[Supabase] Connection test exception:", e);
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
      console.error("[Supabase] Error getting session:", error.message);
      return null;
    }
    return session;
  } catch (e) {
    console.error("[Supabase] Exception getting session:", e);
    return null;
  }
};

// Add a function to test network connectivity more broadly
export const testNetworkConnectivity = async () => {
  try {
    console.log("[Supabase] Testing general network connectivity...");
    const startTime = Date.now();
    // Try to fetch a known reliable endpoint
    const response = await fetch("https://httpbin.org/get");
    const duration = Date.now() - startTime;

    if (response.ok) {
      console.log(`[Supabase] Network test successful (${duration}ms)`);
      return true;
    } else {
      console.error(
        `[Supabase] Network test failed with status ${response.status} after ${duration}ms`
      );
      return false;
    }
  } catch (e) {
    console.error("[Supabase] Network connectivity test exception:", e);
    return false;
  }
};
