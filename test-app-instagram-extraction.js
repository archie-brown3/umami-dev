#!/usr/bin/env node

/**
 * Test script to verify app's Instagram extraction works with generic web scraper
 * This tests the actual app functions after fixing them to use /api/scrape-web
 */

const fetch = require("node-fetch");

// Simulate the app's configuration
const RECIPE_EXTRACTION_SERVICE_URL =
  "https://recipeextractionservice.onrender.com";

/**
 * Simulate the app's extractUsernameFromUrl function
 */
function extractUsernameFromUrl(url, scrapedData) {
  // Try to extract from URL first
  const urlMatch = url.match(/instagram\.com\/([^\/\?]+)/i);
  if (
    urlMatch &&
    urlMatch[1] !== "share" &&
    urlMatch[1] !== "p" &&
    urlMatch[1] !== "reel"
  ) {
    return urlMatch[1];
  }

  // Try to extract from Open Graph title
  const ogTitle = scrapedData.metadata?.open_graph?.title;
  if (ogTitle) {
    const match = ogTitle.match(/(\w+) on Instagram/i);
    if (match) return match[1];
  }

  return "unknown";
}

/**
 * Simulate the fixed app's testInstagramScraping function
 */
async function testInstagramScraping(url) {
  try {
    console.log(
      `🧪 Testing app's Instagram extraction with generic web scraper for: ${url}`
    );

    // Validate it's an Instagram URL
    if (!url.includes("instagram.com")) {
      return {
        success: false,
        message: "URL is not an Instagram URL",
      };
    }

    // Use the generic scrape-web endpoint for scalability
    const response = await fetch(
      `${RECIPE_EXTRACTION_SERVICE_URL}/api/scrape-web`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          options: {
            text: true,
            metadata: true,
            images: true,
            headings: true,
            links: true,
            tables: false,
            forms: false,
          },
        }),
      }
    );

    if (!response.ok) {
      return {
        success: false,
        message: `Scrape API Error: ${response.status} ${response.statusText}`,
      };
    }

    const result = await response.json();

    // Extract Instagram-specific data from the generic web scraper response
    const caption =
      result.metadata?.open_graph?.description ||
      result.metadata?.description ||
      result.text?.full_text ||
      "No caption extracted";

    const username = extractUsernameFromUrl(url, result);
    const thumbnail =
      result.metadata?.open_graph?.image ||
      result.images?.images?.[0]?.url ||
      null;

    // Validate we have substantial content
    if (caption.length < 500) {
      return {
        success: false,
        message: `Caption too short: ${caption.length} chars. Instagram may be blocking access.`,
      };
    }

    const extractedData = {
      caption,
      username,
      thumbnail,
    };

    console.log(`✅ Instagram generic web scraping completed: {
      "caption_length": ${extractedData.caption.length},
      "username": "${extractedData.username}",
      "has_thumbnail": ${!!extractedData.thumbnail}
    }`);

    return {
      success: true,
      message: "Instagram extraction successful with generic web scraper",
      scrapedData: result,
      extractedData,
      rawResponse: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`❌ Instagram generic web scraping failed: ${errorMessage}`);

    return {
      success: false,
      message: `Instagram extraction failed: ${errorMessage}`,
    };
  }
}

/**
 * Test the app's Instagram extraction workflow
 */
async function testAppInstagramExtraction(url) {
  console.log("🚀 TESTING APP'S INSTAGRAM EXTRACTION");
  console.log("=".repeat(60));
  console.log(`📱 URL: ${url}`);
  console.log(`🔧 Method: Generic web scraper (/api/scrape-web)`);
  console.log(`🎯 Expected: Full recipe extraction like test script\n`);

  const startTime = Date.now();
  const result = await testInstagramScraping(url);
  const totalTime = Date.now() - startTime;

  console.log("\n📊 EXTRACTION RESULTS:");
  console.log("=".repeat(30));
  console.log(`Status: ${result.success ? "✅ SUCCESS" : "❌ FAILED"}`);
  console.log(`Time: ${totalTime}ms`);

  if (result.success && result.extractedData) {
    const { caption, username, thumbnail } = result.extractedData;

    console.log("\n🎯 EXTRACTED DATA QUALITY:");
    console.log("=".repeat(30));
    console.log(
      `📝 Caption Length: ${caption.length} chars ${
        caption.length > 1000 ? "✅" : "⚠️"
      }`
    );
    console.log(
      `👤 Username: "${username}" ${username !== "unknown" ? "✅" : "⚠️"}`
    );
    console.log(`🖼️  Thumbnail: ${thumbnail ? "✅ Found" : "❌ Missing"}`);

    console.log("\n📋 CAPTION PREVIEW:");
    console.log("=".repeat(30));
    console.log(
      `${caption.substring(0, 500)}${caption.length > 500 ? "..." : ""}`
    );

    if (thumbnail) {
      console.log("\n🖼️  THUMBNAIL URL:");
      console.log("=".repeat(30));
      console.log(thumbnail);
    }

    console.log("\n🎉 APP EXTRACTION TEST PASSED!");
    console.log(
      "Your app should now be able to extract Instagram recipes correctly!"
    );
  } else {
    console.log(`\n❌ EXTRACTION FAILED:`);
    console.log(`Error: ${result.message}`);
    console.log("\n🔍 DEBUGGING TIPS:");
    console.log("- Check if Instagram is blocking requests");
    console.log("- Verify the URL is accessible");
    console.log("- Test with different Instagram URLs");
  }
}

// Get URL from command line or use default test URL
const testUrl = process.argv[2] || "https://www.instagram.com/share/BBZ133yzEX";

// Run the test
testAppInstagramExtraction(testUrl).catch(console.error);
