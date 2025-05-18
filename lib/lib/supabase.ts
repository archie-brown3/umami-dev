import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Environment variables should be loaded from a secure config
// For development, you can use expo-constants or a .env file
// Using mock values for now - REPLACE THESE with real values
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://your-project-url.supabase.co";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";

console.log("Supabase URL configured:", !!supabaseUrl); // For debugging

// Create a client even with mock values - this allows the app to load
// in development without proper environment variables
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Default export for Expo Router
export default { supabase };
