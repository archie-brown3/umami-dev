// Test the Render API integration directly
// This tests: ANY webpage → Render API → Content extraction

const testUrl =
  process.argv[2] || "https://www.bbcgoodfood.com/recipes/steak-tartare";

console.log("🌐 Testing Render API Integration");
console.log("=".repeat(60));
console.log(`📍 URL: ${testUrl}`);
console.log("\n🔄 Expected Flow:");
console.log("  1. ✅ Call Render API /api/scrape-web");
console.log("  2. ✅ Get structured webpage content");
console.log("  3. ✅ Verify content quality for AI processing");

async function testRenderAPI() {
  try {
    console.log("\n🚀 Step 1: Testing Render API Health");

    // Check if Render API is available
    const healthResponse = await fetch(
      "https://recipeextractionservice.onrender.com/health"
    );
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log("✅ Render API Health:", healthData.status);
    } else {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }

    console.log("\n🚀 Step 2: Testing Web Scraping");
    console.log(`🌐 Scraping: ${new URL(testUrl).hostname}`);

    const startTime = Date.now();

    const scrapeResponse = await fetch(
      "https://recipeextractionservice.onrender.com/api/scrape-web",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: testUrl,
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
      }
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (!scrapeResponse.ok) {
      throw new Error(
        `Scrape failed: ${scrapeResponse.status} ${scrapeResponse.statusText}`
      );
    }

    const scrapedData = await scrapeResponse.json();

    console.log(`✅ Scraping completed in ${duration}ms`);
    console.log("\n📊 SCRAPED DATA ANALYSIS:");
    console.log("=".repeat(40));

    // Analyze the scraped data quality
    console.log(`🌐 URL: ${scrapedData.url}`);
    console.log(`📄 Status: ${scrapedData.status_code}`);
    console.log(`📝 Title: ${scrapedData.metadata?.title || "NOT FOUND"}`);
    console.log(
      `📖 Description: ${
        scrapedData.metadata?.description
          ? scrapedData.metadata.description.substring(0, 60) + "..."
          : "NOT FOUND"
      }`
    );

    // Text content analysis
    if (scrapedData.text) {
      console.log(`\n📄 TEXT CONTENT:`);
      console.log(
        `  • Full text length: ${scrapedData.text.full_text?.length || 0} chars`
      );
      console.log(`  • Word count: ${scrapedData.text.word_count || 0} words`);
      console.log(
        `  • Preview: "${
          scrapedData.text.preview?.substring(0, 80) || "None"
        }..."`
      );
    }

    // Headings analysis
    if (scrapedData.headings) {
      console.log(`\n📑 HEADINGS:`);
      console.log(`  • H1 headings: ${scrapedData.headings.h1?.length || 0}`);
      if (scrapedData.headings.h1?.length > 0) {
        console.log(`    - "${scrapedData.headings.h1[0]}"`);
      }
      console.log(`  • H2 headings: ${scrapedData.headings.h2?.length || 0}`);
      if (scrapedData.headings.h2?.length > 0) {
        console.log(`    - "${scrapedData.headings.h2[0]}"`);
      }
    }

    // Images analysis
    if (scrapedData.images) {
      console.log(`\n🖼️  IMAGES:`);
      console.log(`  • Total images: ${scrapedData.images.total_images || 0}`);
      if (scrapedData.images.images?.length > 0) {
        const firstImage = scrapedData.images.images[0];
        console.log(`  • First image: ${firstImage.url}`);
        console.log(`  • Alt text: "${firstImage.alt || "None"}"`);
      }
    }

    // Open Graph data
    if (scrapedData.metadata?.open_graph) {
      console.log(`\n🔗 OPEN GRAPH:`);
      console.log(
        `  • OG Title: ${scrapedData.metadata.open_graph.title || "None"}`
      );
      console.log(
        `  • OG Description: ${
          scrapedData.metadata.open_graph.description || "None"
        }`
      );
      console.log(
        `  • OG Image: ${scrapedData.metadata.open_graph.image || "None"}`
      );
    }

    // Content quality assessment for AI processing
    console.log("\n🎯 AI PROCESSING READINESS:");
    console.log("=".repeat(30));

    // Build the content that would be sent to AI
    const contentParts = [];

    if (scrapedData.metadata?.title) {
      contentParts.push(`Title: ${scrapedData.metadata.title}`);
    }

    if (scrapedData.metadata?.description) {
      contentParts.push(`Description: ${scrapedData.metadata.description}`);
    }

    if (scrapedData.headings?.h1?.length > 0) {
      contentParts.push(
        `\nMain Headings: ${scrapedData.headings.h1.join(", ")}`
      );
    }

    if (scrapedData.headings?.h2?.length > 0) {
      contentParts.push(
        `\nSection Headings: ${scrapedData.headings.h2.join(", ")}`
      );
    }

    if (scrapedData.text?.full_text) {
      contentParts.push(`\nContent:\n${scrapedData.text.full_text}`);
    }

    const aiReadyContent = contentParts.join("\n").substring(0, 1000); // Show first 1000 chars

    console.log(`📝 AI-ready content length: ${aiReadyContent.length} chars`);
    console.log(`📊 Content preview:`);
    console.log("-".repeat(50));
    console.log(aiReadyContent);
    console.log("-".repeat(50));

    // Quality checks
    const hasTitle = !!scrapedData.metadata?.title;
    const hasContent = !!(
      scrapedData.text?.full_text && scrapedData.text.full_text.length > 100
    );
    const hasHeadings = !!(
      scrapedData.headings?.h1?.length > 0 ||
      scrapedData.headings?.h2?.length > 0
    );
    const hasImages = !!(scrapedData.images?.total_images > 0);
    const hasSufficientWords = !!(
      scrapedData.text?.word_count && scrapedData.text.word_count > 50
    );

    const qualityScore = [
      hasTitle,
      hasContent,
      hasHeadings,
      hasImages,
      hasSufficientWords,
    ].filter(Boolean).length;

    console.log("\n✅ QUALITY ASSESSMENT:");
    console.log(`📋 Score: ${qualityScore}/5`);
    console.log(`✅ Has title: ${hasTitle}`);
    console.log(`✅ Has substantial content: ${hasContent}`);
    console.log(`✅ Has headings: ${hasHeadings}`);
    console.log(`✅ Has images: ${hasImages}`);
    console.log(`✅ Sufficient word count: ${hasSufficientWords}`);

    if (qualityScore >= 4) {
      console.log("\n🎉 EXCELLENT: Content is ready for AI processing!");
      console.log(
        "🚀 This data should produce high-quality recipe extraction."
      );
    } else if (qualityScore >= 3) {
      console.log("\n⚠️  GOOD: Content should work for AI processing.");
    } else {
      console.log("\n❌ POOR: Content quality may affect AI processing.");
    }

    console.log(
      "\n🔗 NEXT STEP: This content would now be sent to DeepSeek AI for recipe extraction and enhancement."
    );

    return {
      success: true,
      duration,
      qualityScore,
      wordCount: scrapedData.text?.word_count || 0,
      hasImages: hasImages,
    };
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);

    if (error.message.includes("Health check failed")) {
      console.error("🚨 RENDER API SERVICE DOWN");
      console.error("   The Render service may be sleeping or unavailable");
      console.error("   Wait a few minutes and try again");
    } else if (error.message.includes("Scrape failed")) {
      console.error("🚨 SCRAPING FAILED");
      console.error("   The specific URL may be blocked or problematic");
      console.error("   Try a different recipe website");
    } else {
      console.error("🚨 UNKNOWN ERROR");
      console.error("   Check network connection and URL validity");
    }

    return { success: false, error: error.message };
  }
}

console.log("\n🚀 Starting Render API Integration Test...");
testRenderAPI()
  .then((result) => {
    if (result.success) {
      console.log(`\n🎉 SUCCESS: Render API integration working perfectly!`);
      console.log(`⏱️  Duration: ${result.duration}ms`);
      console.log(`📊 Quality: ${result.qualityScore}/5`);
      console.log(`📝 Words: ${result.wordCount}`);
      console.log(`🖼️  Images: ${result.hasImages ? "Found" : "None"}`);
    } else {
      console.log(`\n💥 FAILED: ${result.error}`);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("💥 Test suite crashed:", error);
    process.exit(1);
  });
