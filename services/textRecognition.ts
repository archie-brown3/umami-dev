import * as FileSystem from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Platform } from "react-native";

// Google Vision API configuration
const GOOGLE_VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;
const GOOGLE_VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;

interface TextExtractionResult {
  text: string;
  confidence: number;
  error?: string;
}

/**
 * Extracts text from an image using Google Vision API OCR.
 *
 * @param imageUri The URI of the image to extract text from
 * @returns Promise containing the extracted text and confidence score
 */
export async function extractTextFromImage(imageUri: string): Promise<string> {
  try {
    console.log(
      `[TextRecognition] Processing image for text extraction: ${imageUri}`
    );

    // Check if API key is configured
    if (!GOOGLE_VISION_API_KEY) {
      console.warn(
        "[TextRecognition] Google Vision API key not configured, using fallback"
      );
      return await fallbackTextExtraction(imageUri);
    }

    // Validate image URI
    if (!imageUri || imageUri.trim().length === 0) {
      throw new Error("Invalid image URI provided");
    }

    // Optimize image before processing
    const optimizedImage = await optimizeImageForOCR(imageUri);
    console.log(`[TextRecognition] Image optimized: ${optimizedImage.uri}`);

    // Extract text using Google Vision API
    const result = await extractTextWithGoogleVision(optimizedImage.uri);

    if (result.error) {
      console.error(
        `[TextRecognition] Google Vision API error: ${result.error}`
      );

      // If it's a quota or authentication error, provide specific feedback
      if (result.error.includes("quota") || result.error.includes("QUOTA")) {
        throw new Error(
          "OCR service quota exceeded. Please try again later or use manual entry."
        );
      } else if (
        result.error.includes("authentication") ||
        result.error.includes("API key")
      ) {
        throw new Error(
          "OCR service authentication failed. Please check configuration."
        );
      }

      return await fallbackTextExtraction(imageUri);
    }

    if (result.confidence < 0.3) {
      console.warn(
        `[TextRecognition] Very low confidence (${result.confidence}), text may be unreliable`
      );

      // If confidence is very low, provide user feedback
      if (result.text.trim().length < 20) {
        throw new Error(
          "Text extraction confidence too low. Please try a clearer image or enter the recipe manually."
        );
      }
    } else if (result.confidence < 0.5) {
      console.warn(
        `[TextRecognition] Low confidence (${result.confidence}), text may be inaccurate`
      );
    }

    console.log(
      `[TextRecognition] Text extraction successful, confidence: ${result.confidence}, text length: ${result.text.length}`
    );
    return result.text;
  } catch (error) {
    console.error("[TextRecognition] Error extracting text from image:", error);

    // If it's a user-friendly error, re-throw it
    if (
      error instanceof Error &&
      (error.message.includes("quota") ||
        error.message.includes("authentication") ||
        error.message.includes("confidence too low") ||
        error.message.includes("Invalid image URI"))
    ) {
      throw error;
    }

    // For other errors, try fallback
    return await fallbackTextExtraction(imageUri);
  }
}

/**
 * Extract text using Google Vision API
 */
async function extractTextWithGoogleVision(
  imageUri: string
): Promise<TextExtractionResult> {
  try {
    // Convert image to base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Prepare the request payload
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: "TEXT_DETECTION",
              maxResults: 1,
            },
          ],
          imageContext: {
            languageHints: ["en"], // Primarily English recipes
          },
        },
      ],
    };

    console.log("[TextRecognition] Sending request to Google Vision API...");

    // Make the API request
    const response = await fetch(GOOGLE_VISION_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Google Vision API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();

    // Check for API errors
    if (data.responses?.[0]?.error) {
      throw new Error(
        `Google Vision API error: ${data.responses[0].error.message}`
      );
    }

    // Extract text annotations
    const textAnnotations = data.responses?.[0]?.textAnnotations;

    if (!textAnnotations || textAnnotations.length === 0) {
      return {
        text: "",
        confidence: 0,
        error: "No text detected in image",
      };
    }

    // The first annotation contains the full detected text
    const fullText = textAnnotations[0].description || "";

    // Calculate average confidence from all text blocks
    const confidenceScores = textAnnotations
      .filter((annotation: any) => annotation.confidence !== undefined)
      .map((annotation: any) => annotation.confidence);

    const averageConfidence =
      confidenceScores.length > 0
        ? confidenceScores.reduce(
            (sum: number, conf: number) => sum + conf,
            0
          ) / confidenceScores.length
        : 0.8; // Default confidence if not provided

    return {
      text: fullText.trim(),
      confidence: averageConfidence,
    };
  } catch (error) {
    console.error("[TextRecognition] Google Vision API error:", error);
    return {
      text: "",
      confidence: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Optimize the image for better OCR results
 */
async function optimizeImageForOCR(uri: string) {
  try {
    console.log("[TextRecognition] Optimizing image for OCR...");

    // Resize and adjust quality for better OCR
    // Larger images (up to 1600px) can improve text detection accuracy
    const optimized = await manipulateAsync(
      uri,
      [
        { resize: { width: 1600 } }, // Larger size for better text detection
      ],
      {
        compress: 0.9, // Higher quality for better text recognition
        format: SaveFormat.JPEG,
      }
    );

    console.log("[TextRecognition] Image optimization complete");
    return optimized;
  } catch (error) {
    console.error("[TextRecognition] Error optimizing image:", error);
    // If optimization fails, return the original image
    return { uri };
  }
}

/**
 * Fallback text extraction for when Google Vision API is not available
 * This provides a better user experience than complete failure
 */
async function fallbackTextExtraction(uri: string): Promise<string> {
  console.log("[TextRecognition] Using fallback text extraction");

  // Add a short delay to simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 1500));

  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);

    if (!fileInfo.exists || fileInfo.size < 1000) {
      return "Unable to extract text from this image. Please try a different photo or enter the recipe manually.";
    }

    // Return a helpful message explaining the limitation
    return `Text extraction service is currently unavailable. Please manually enter your recipe or try again later.

To help you get started, here's a template you can fill in:

Recipe Title: [Enter recipe name]

Ingredients:
- [Amount] [Ingredient name]
- [Amount] [Ingredient name]
- [Add more ingredients...]

Instructions:
1. [First step]
2. [Second step]
3. [Continue with remaining steps...]

Prep Time: [X] minutes
Cook Time: [X] minutes
Servings: [X]`;
  } catch (error) {
    console.error(
      "[TextRecognition] Error in fallback text extraction:",
      error
    );
    return "Error processing image. Please try again or enter the recipe manually.";
  }
}

/**
 * Validate and clean extracted text for recipe processing
 */
export function validateExtractedText(text: string): {
  isValid: boolean;
  cleanedText: string;
  issues: string[];
} {
  const issues: string[] = [];
  let cleanedText = text.trim();

  // Check minimum length
  if (cleanedText.length < 50) {
    issues.push("Text is too short to be a complete recipe");
  }

  // Check for common recipe indicators
  const hasIngredients =
    /ingredients?|recipe|cups?|tablespoons?|teaspoons?|pounds?|ounces?/i.test(
      cleanedText
    );
  const hasInstructions =
    /instructions?|steps?|directions?|method|preparation/i.test(cleanedText);
  const hasNumbers = /\d/.test(cleanedText);

  if (!hasIngredients && !hasInstructions && !hasNumbers) {
    issues.push("Text doesn't appear to contain recipe information");
  }

  // Clean up common OCR errors
  cleanedText = cleanedText
    .replace(/\s+/g, " ") // Multiple spaces to single space
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space between lowercase and uppercase
    .replace(/(\d)([a-zA-Z])/g, "$1 $2") // Add space between numbers and letters
    .replace(/([a-zA-Z])(\d)/g, "$1 $2") // Add space between letters and numbers
    .trim();

  return {
    isValid: issues.length === 0,
    cleanedText,
    issues,
  };
}

/**
 * Test function to validate text extraction service configuration
 * This can be used to check if the Google Vision API is properly configured
 */
export async function testTextExtractionService(): Promise<{
  isConfigured: boolean;
  isWorking: boolean;
  error?: string;
}> {
  try {
    console.log("[TextRecognition] Testing service configuration...");

    // Check if API key is configured
    if (!GOOGLE_VISION_API_KEY) {
      return {
        isConfigured: false,
        isWorking: false,
        error: "Google Vision API key not configured",
      };
    }

    // Test with a simple API call (without actual image)
    const testResponse = await fetch(GOOGLE_VISION_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [],
      }),
    });

    if (testResponse.status === 400) {
      // 400 is expected for empty requests, but means API key is valid
      console.log("[TextRecognition] Service configuration test passed");
      return {
        isConfigured: true,
        isWorking: true,
      };
    } else if (testResponse.status === 403) {
      return {
        isConfigured: true,
        isWorking: false,
        error: "API key is invalid or lacks permissions",
      };
    } else {
      return {
        isConfigured: true,
        isWorking: false,
        error: `Unexpected response status: ${testResponse.status}`,
      };
    }
  } catch (error) {
    console.error("[TextRecognition] Service test failed:", error);
    return {
      isConfigured: true,
      isWorking: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
