import * as FileSystem from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Platform } from "react-native";

/**
 * Extracts text from an image using device-specific OCR capabilities.
 *
 * @param imageUri The URI of the image to extract text from
 * @returns Promise containing the extracted text
 */
export async function extractTextFromImage(imageUri: string): Promise<string> {
  try {
    console.log(`Processing image for text extraction: ${imageUri}`);

    // Optimize image before processing
    const optimizedImage = await optimizeImageForOCR(imageUri);

    // Check platform availability - this is just a mock implementation
    // In a real implementation, this would use platform-specific OCR libraries
    // For iOS, Vision framework could be used
    // For Android, ML Kit Text Recognition could be used
    if (Platform.OS === "ios") {
      // Mock iOS implementation - in a real app, this would use native modules
      return mockTextExtraction(optimizedImage.uri);
    } else if (Platform.OS === "android") {
      // Mock Android implementation - in a real app, this would use native modules
      return mockTextExtraction(optimizedImage.uri);
    } else {
      // Web or other platform
      return "Text recognition is not supported on this platform.";
    }
  } catch (error) {
    console.error("Error extracting text from image:", error);
    return "Failed to extract text from image.";
  }
}

/**
 * Optimize the image for better OCR results
 */
async function optimizeImageForOCR(uri: string) {
  try {
    // Resize and adjust quality for better OCR
    return await manipulateAsync(uri, [{ resize: { width: 1200 } }], {
      compress: 0.8,
      format: SaveFormat.JPEG,
    });
  } catch (error) {
    console.error("Error optimizing image:", error);
    // If optimization fails, return the original image
    return { uri };
  }
}

/**
 * Mock implementation for testing purposes
 * In a real app, this would be replaced with actual OCR
 */
async function mockTextExtraction(uri: string): Promise<string> {
  // Add a short delay to simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Get the file info to determine if this is a real image
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);

    if (!fileInfo.exists || fileInfo.size < 1000) {
      return "Unable to extract text from this image.";
    }

    // Return mock extracted text
    return `
Recipe: Homemade Chocolate Chip Cookies

Ingredients:
- 2 1/4 cups all-purpose flour
- 1 tsp baking soda
- 1 tsp salt
- 1 cup (2 sticks) butter, softened
- 3/4 cup granulated sugar
- 3/4 cup packed brown sugar
- 2 large eggs
- 2 tsp vanilla extract
- 2 cups chocolate chips

Instructions:
1. Preheat oven to 375°F.
2. Combine flour, baking soda, and salt in a small bowl.
3. Beat butter, granulated sugar, and brown sugar until creamy.
4. Add eggs one at a time, then vanilla.
5. Gradually beat in flour mixture.
6. Stir in chocolate chips.
7. Drop by rounded tablespoon onto baking sheets.
8. Bake for 9-11 minutes or until golden brown.
9. Cool on baking sheets for 2 minutes, then move to wire racks.
    `;
  } catch (error) {
    console.error("Error in mock text extraction:", error);
    return "Error processing image text.";
  }
}
