#!/usr/bin/env node

/**
 * Instagram Scraping Test Script
 *
 * Tests the new /scrape-web endpoint for Instagram posts
 * Usage: node scripts/test-instagram-scraping.js [instagram-url]
 */

const fetch = require("node-fetch");

const RECIPE_EXTRACTION_SERVICE_URL =
  "https://recipeextractionservice.onrender.com";

async function testInstagramScraping(url) {
  console.log(`🧪 Testing Instagram scraping for: ${url}`);
  console.log("=" + "=".repeat(50));

  try {
    // Validate Instagram URL
    if (!url.includes("instagram.com")) {
      throw new Error("URL is not an Instagram URL");
    }

    console.log("📡 Making request to scrape-web API...");

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

    console.log(
      `📊 Response status: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const scrapedData = await response.json();
    console.log("✅ Successfully scraped Instagram post data");

    // Extract Instagram-specific data
    const caption =
      scrapedData.metadata?.open_graph?.description ||
      scrapedData.metadata?.description ||
      scrapedData.text?.full_text
        ?.split("\n")
        .slice(0, 5)
        .join(" ")
        .substring(0, 1000) ||
      "No caption extracted";

    const username = url.match(/instagram\.com\/([^\/\?]+)/i)?.[1] || "unknown";
    const thumbnail = scrapedData.images?.images?.[0]?.url || null;

    // Display results
    console.log("\n📋 EXTRACTION RESULTS:");
    console.log("-".repeat(30));
    console.log(`👤 Username: ${username}`);
    console.log(`📝 Caption Length: ${caption.length} characters`);
    console.log(`🖼️  Has Thumbnail: ${thumbnail ? "Yes" : "No"}`);
    console.log(`📊 Total Images: ${scrapedData.images?.total_images || 0}`);
    console.log(`📄 Word Count: ${scrapedData.text?.word_count || 0}`);

    if (thumbnail) {
      console.log(`🔗 Thumbnail URL: ${thumbnail}`);
    }

    console.log("\n📝 CAPTION PREVIEW:");
    console.log("-".repeat(30));
    console.log(
      caption.substring(0, 300) + (caption.length > 300 ? "..." : "")
    );

    console.log("\n🔍 RAW DATA STRUCTURE:");
    console.log("-".repeat(30));
    console.log(`text: ${scrapedData.text ? "present" : "missing"}`);
    console.log(`metadata: ${scrapedData.metadata ? "present" : "missing"}`);
    console.log(`images: ${scrapedData.images ? "present" : "missing"}`);
    console.log(
      `open_graph: ${scrapedData.metadata?.open_graph ? "present" : "missing"}`
    );

    if (scrapedData.metadata?.open_graph) {
      console.log(
        `  - title: ${scrapedData.metadata.open_graph.title || "none"}`
      );
      console.log(
        `  - description: ${
          scrapedData.metadata.open_graph.description || "none"
        }`
      );
      console.log(
        `  - image: ${scrapedData.metadata.open_graph.image || "none"}`
      );
    }

    // Show some raw data for analysis
    console.log("\n🗂️  METADATA KEYS:");
    console.log("-".repeat(30));
    if (scrapedData.metadata) {
      console.log(
        "Available metadata keys:",
        Object.keys(scrapedData.metadata)
      );
    }

    console.log("\n✅ Test completed successfully!");
    return {
      success: true,
      extractedData: { caption, username, thumbnail },
      rawData: scrapedData,
    };
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("📱 Instagram Scraping Test Script");
    console.log(
      "Usage: node scripts/test-instagram-scraping.js <instagram-url>"
    );
    console.log("\nExample:");
    console.log(
      '  node scripts/test-instagram-scraping.js "https://www.instagram.com/p/ABC123/"'
    );
    process.exit(1);
  }

  const url = args[0];

  console.log("🚀 Starting Instagram scraping test...\n");

  const result = await testInstagramScraping(url);

  if (result.success) {
    console.log(
      "\n🎉 All tests passed! You can now analyze the output to optimize extraction."
    );
  } else {
    console.log("\n💥 Test failed. Check the error above and try again.");
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}
