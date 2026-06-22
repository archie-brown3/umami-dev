export const API_ENDPOINTS = {
  EXTRACT_API_URL:
    process.env.EXPO_PUBLIC_RECIPE_EXTRACTION_SERVICE_URL ||
    "https://recipeextractionservice.onrender.com",
  RECIPE_EXTRACTION_SERVICE_URL:
    process.env.EXPO_PUBLIC_RECIPE_EXTRACTION_SERVICE_URL ||
    "https://recipeextractionservice.onrender.com",
  DEEPSEEK_API_URL: "https://api.deepseek.com/v1/chat/completions",
  DEEPSEEK_API_KEY:
    process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    "sk-b168886219d34d939d0b7c6f760b4123", // Use the original fallback
} as const;

export const API_TIMEOUT = 10000; // 10 seconds

export const STATUS_COLORS = {
  success: "#4CAF50",
  error: "#F44336",
} as const;
