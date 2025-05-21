export const API_ENDPOINTS = {
  EXTRACT_API_URL: process.env.EXPO_PUBLIC_RECIPE_EXTRACTION_SERVICE_URL || "",
  DEEPSEEK_API_URL: "https://api.deepseek.com/v1/chat/completions",
  SUPABASE_API_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
} as const;

export const API_TIMEOUT = 10000; // 10 seconds

export const STATUS_COLORS = {
  success: "#4CAF50",
  error: "#F44336",
} as const;
