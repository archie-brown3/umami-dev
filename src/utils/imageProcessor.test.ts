/**
 * Test utility for imageProcessor
 * Verifies localhost URL handling and other image processing scenarios
 * Note: This is a development utility, not a Jest test file
 */

import {
  processImageUrl,
  processRecipeImageUrl,
  processInstagramImageUrl,
} from "./imageProcessor";

// Manual test function for development
export function testImageProcessing() {
  console.log("=== Image Processor Test ===");

  const testCases = [
    {
      name: "Localhost proxy URL",
      url: "http://localhost:3001/api/image-proxy?url=https%3A%2F%2Finstagram.fltn3-1.fna.fbcdn.net%2Fv%2Ft51.2885-15%2F123456789_123456789_123456789_n.jpg",
      expected: "Should extract original URL and re-proxy",
    },
    {
      name: "Instagram CDN URL",
      url: "https://instagram.fltn3-1.fna.fbcdn.net/v/t51.2885-15/123456789_123456789_123456789_n.jpg",
      expected: "Should proxy through external service",
    },
    {
      name: "Regular image URL",
      url: "https://example.com/image.jpg",
      expected: "Should pass through unchanged",
    },
    {
      name: "Already proxied URL",
      url: "https://recipeextractionservice.onrender.com/api/image-proxy?url=https%3A%2F%2Fexample.com%2Fimage.jpg",
      expected: "Should return as-is (no double-proxying)",
    },
    {
      name: "Undefined URL",
      url: undefined,
      expected: "Should return undefined",
    },
    {
      name: "Empty string",
      url: "",
      expected: "Should return undefined",
    },
  ];

  testCases.forEach(({ name, url, expected }) => {
    console.log(`\n${name}:`);
    console.log(`Input:    ${url || "undefined"}`);
    console.log(`Expected: ${expected}`);

    try {
      const result = processImageUrl(url as any);
      console.log(`Output:   ${result || "undefined"}`);

      // Basic validation
      if (url && typeof url === "string") {
        if (url.includes("localhost:3001/api/image-proxy")) {
          const isFixed = result && !result.includes("localhost");
          console.log(`✓ Localhost fix: ${isFixed ? "PASS" : "FAIL"}`);
        } else if (url.includes("instagram") || url.includes("fbcdn.net")) {
          const isProxied =
            result &&
            (result.includes("weserv.nl") || result.includes("image-proxy"));
          console.log(`✓ Instagram proxy: ${isProxied ? "PASS" : "FAIL"}`);
        } else if (url.includes("recipeextractionservice.onrender.com")) {
          const noDoubleProxy = result === url;
          console.log(`✓ No double-proxy: ${noDoubleProxy ? "PASS" : "FAIL"}`);
        }
      }
    } catch (error) {
      console.log(
        `❌ Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  console.log("\n=== Instagram-specific Tests ===");

  const instagramTestCases = [
    "https://instagram.fltn3-1.fna.fbcdn.net/v/t51.2885-15/123456789_123456789_123456789_n.jpg",
    "https://scontent-lax3-2.cdninstagram.com/v/t51.2885-15/123456789_123456789_123456789_n.jpg",
  ];

  instagramTestCases.forEach((url, index) => {
    console.log(`\nInstagram Test ${index + 1}:`);
    console.log(`Input:  ${url}`);

    try {
      const result = processInstagramImageUrl(url);
      console.log(`Output: ${result}`);

      const isOptimized =
        result && result.includes("weserv.nl") && result.includes("&il&af&we");
      console.log(`✓ Instagram optimized: ${isOptimized ? "PASS" : "FAIL"}`);
    } catch (error) {
      console.log(
        `❌ Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  console.log("\n=== Recipe Image Tests ===");

  const recipeTestCases = [
    "https://example.com/recipe-image.jpg",
    "http://localhost:3001/api/image-proxy?url=https%3A%2F%2Fexample.com%2Frecipe.jpg",
  ];

  recipeTestCases.forEach((url, index) => {
    console.log(`\nRecipe Test ${index + 1}:`);
    console.log(`Input:  ${url}`);

    try {
      const result = processRecipeImageUrl(url);
      console.log(`Output: ${result}`);
    } catch (error) {
      console.log(
        `❌ Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  console.log("\n=== Test Complete ===");
}

/**
 * Run a quick validation test
 */
export function quickImageTest() {
  console.log("=== Quick Image Processor Validation ===");

  // Test basic functionality
  const testUrl = "https://instagram.fltn3-1.fna.fbcdn.net/test.jpg";
  const result = processImageUrl(testUrl);

  console.log(`Test URL: ${testUrl}`);
  console.log(`Result: ${result}`);
  console.log(
    `Status: ${result && result !== testUrl ? "✓ WORKING" : "❌ ISSUE"}`
  );

  return result && result !== testUrl;
}
