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

// Check for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check your .env file and ensure the app is rebuilt after any changes."
  );
}

// For debugging purposes, log a masked version of the URL (not the key)
const maskedUrl = supabaseUrl.replace(/^(https?:\/\/[^.]+)(.*)$/, "$1...");
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
