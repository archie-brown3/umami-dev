import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase environment variables. Check your .env file.",
    { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey }
  );
} else {
  console.log("Supabase URL configured:", !!supabaseUrl);
  console.log("Supabase Key configured:", !!supabaseAnonKey);

  // For debugging purposes, log a masked version of the URL (not the key)
  if (supabaseUrl) {
    const maskedUrl = supabaseUrl.replace(/^(https?:\/\/[^.]+)(.*)$/, "$1...");
    console.log("Connecting to Supabase URL:", maskedUrl);
  }
}

// Configure client with more detailed error handling and retries
export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      "X-Client-Info": "expo-react-native",
    },
  },
  // Add more extensive retry logic
  db: {
    schema: "public",
  },
  // Increase timeout for better reliability on unstable networks
  realtime: {
    timeout: 20000,
  },
});

// Helper function to check if Supabase connection is available
export const checkSupabaseConnection = async () => {
  try {
    console.log("Testing Supabase connection...");
    // Simple query to check connection
    const startTime = Date.now();
    const { data, error } = await supabase
      .from("shopping_lists")
      .select("count", { count: "exact", head: true });

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
