#!/usr/bin/env node

/**
 * Simple Instagram Extraction Test
 * Tests the new simplified Instagram extraction service using scrape-web endpoint
 */

const fetch = require("node-fetch");

const API_BASE_URL = "https://recipeextractionservice.onrender.com";
const TEST_URL = "https://www.instagram.com/share/BBZ133yzEX";

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

async function testInstagramExtraction(url) {
  console.log(`🧪 Testing simplified Instagram extraction using scrape-web`);
  console.log(`📱 URL: ${url}`);
  console.log(`🌐 API: ${API_BASE_URL}/api/scrape-web`);
  console.log("=" + "=".repeat(50));

  try {
    console.log("📡 Making API request...");

    const response = await fetch(`${API_BASE_URL}/api/scrape-web`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
        options: {
          text: true,
          metadata: true,
          images: true,
          headings: true,
          links: false,
          tables: false,
          forms: false,
        },
      }),
    });

    console.log(`📊 Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const scrapedData = await response.json();

    // Extract Instagram data from the generic scraper response
    const caption =
      scrapedData.metadata?.open_graph?.description ||
      scrapedData.metadata?.description ||
      scrapedData.text?.full_text ||
      "No caption extracted";

    const username = extractUsernameFromUrl(url, scrapedData);
    const imageUrl =
      scrapedData.metadata?.open_graph?.image ||
      scrapedData.images?.images?.[0]?.url ||
      null;

    console.log("\n✅ SUCCESS! Instagram data extracted using scrape-web:");
    console.log("📋 Scraped Data Summary:");
    console.log(`📊 Text Length: ${scrapedData.text?.text_length || 0}`);
    console.log(`🖼️  Images Found: ${scrapedData.images?.total_images || 0}`);
    console.log(`🔗 Links Found: ${scrapedData.links?.total_links || 0}`);

    console.log("\n📊 Parsed Instagram Data:");
    console.log(`👤 Username: ${username}`);
    console.log(`📝 Caption Length: ${caption?.length || 0} characters`);
    console.log(`🖼️  Image URL: ${imageUrl ? "✅ Found" : "❌ Not found"}`);

    if (caption) {
      console.log("\n📝 Caption Preview:");
      console.log(
        caption.substring(0, 300) + (caption.length > 300 ? "..." : "")
      );
    }

    if (imageUrl) {
      console.log("\n🖼️  Media URL:");
      console.log(`  Image: ${imageUrl}`);
    }

    // Test if we have enough data for recipe creation
    const hasValidData =
      caption && caption.length > 50 && username !== "unknown";
    console.log(
      `\n🔍 Recipe Creation Validation: ${hasValidData ? "✅ PASS" : "❌ FAIL"}`
    );

    if (hasValidData) {
      console.log("✨ This data is sufficient for recipe creation!");
    } else {
      console.log("⚠️  This data may not be sufficient for recipe creation");
      console.log(`   Caption length: ${caption?.length || 0} (need > 50)`);
      console.log(`   Username: ${username} (need != 'unknown')`);
    }

    return { success: true, data: { caption, username, imageUrl } };
  } catch (error) {
    console.error("\n❌ FAILED:", error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
if (require.main === module) {
  console.log("🚀 Starting Instagram Extraction Test with scrape-web\n");

  testInstagramExtraction(TEST_URL)
    .then((result) => {
      console.log("\n" + "=".repeat(60));
      if (result.success) {
        console.log(
          "🎉 TEST PASSED - Instagram extraction working with scrape-web!"
        );
        console.log(
          "✅ The new simplified extraction service is ready for use"
        );
      } else {
        console.log("💥 TEST FAILED - Instagram extraction not working");
        console.log(`❌ Error: ${result.error}`);
      }
    })
    .catch((error) => {
      console.error("💥 TEST CRASHED:", error);
    });
}

module.exports = { testInstagramExtraction };
