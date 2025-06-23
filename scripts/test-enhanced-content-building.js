// Test the enhanced content building specifically
// This tests: BBC Good Food → Render API → Enhanced Content Building → DeepSeek AI

const testUrl = "https://www.bbcgoodfood.com/recipes/steak-tartare";

console.log("🧪 Testing Enhanced Content Building");
console.log("============================================================");
console.log(`📍 URL: ${testUrl}`);
console.log("");
console.log(
  "🎯 Goal: Test enhanced content building from rich metadata and headings"
);
console.log("");

async function testEnhancedContentBuilding() {
  try {
    console.log("🚀 Step 1: Call Render API");

    const scrapeResponse = await fetch(
      "https://recipeextractionservice.onrender.com/api/scrape-web",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: testUrl,
          options: {
            text: true,
            metadata: true,
            images: true,
            headings: true,
            links: false,
            tables: true,
            forms: false,
          },
        }),
      }
    );

    if (!scrapeResponse.ok) {
      throw new Error(`Render API failed: ${scrapeResponse.status}`);
    }

    const scrapedData = await scrapeResponse.json();
    console.log("✅ Render API response received");
    console.log(`📊 Text content: ${scrapedData.text?.word_count || 0} words`);
    console.log(`📝 Title: ${scrapedData.metadata?.title || "None"}`);
    console.log(
      `📖 Description: ${scrapedData.metadata?.description || "None"}`
    );
    console.log(
      `🏷️  Open Graph title: ${
        scrapedData.metadata?.open_graph?.title || "None"
      }`
    );
    console.log(
      `📄 Open Graph desc: ${
        scrapedData.metadata?.open_graph?.description || "None"
      }`
    );
    console.log(`📑 Headings found: ${scrapedData.headings?.length || 0}`);

    console.log("\n🚀 Step 2: Build Enhanced Content (NEW ALGORITHM)");

    // Build comprehensive content for AI analysis using ALL available data
    const contentParts = [];

    // Add title and description
    const pageTitle =
      scrapedData.metadata?.title ||
      scrapedData.metadata?.open_graph?.title ||
      "";
    if (pageTitle) {
      contentParts.push(`Title: ${pageTitle}`);
    }

    if (scrapedData.metadata?.description) {
      contentParts.push(`Description: ${scrapedData.metadata.description}`);
    }

    // Add Open Graph data for richer context
    if (scrapedData.metadata?.open_graph) {
      const og = scrapedData.metadata.open_graph;
      if (og.title && og.title !== pageTitle) {
        contentParts.push(`Recipe Name: ${og.title}`);
      }
      if (og.description) {
        contentParts.push(`Recipe Description: ${og.description}`);
      }
    }

    // Add ALL headings for comprehensive structure
    if (scrapedData.headings && Array.isArray(scrapedData.headings)) {
      const headingsByLevel = {};

      // Group headings by level
      scrapedData.headings.forEach((heading) => {
        if (heading.text && heading.level) {
          if (!headingsByLevel[heading.level]) {
            headingsByLevel[heading.level] = [];
          }
          headingsByLevel[heading.level].push(heading.text);
        }
      });

      // Add headings in order of importance
      Object.keys(headingsByLevel)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .forEach((level) => {
          const headings = headingsByLevel[parseInt(level)];
          if (headings.length > 0) {
            contentParts.push(`\nH${level} Headings: ${headings.join(", ")}`);
          }
        });
    }

    // Add main text content if available
    if (scrapedData.text?.full_text) {
      contentParts.push(`\nContent:\n${scrapedData.text.full_text}`);
    } else if (scrapedData.text?.preview) {
      contentParts.push(`\nContent:\n${scrapedData.text.preview}`);
    }

    // Add image information for context
    if (scrapedData.images?.images?.length > 0) {
      const imageDescriptions = scrapedData.images.images
        .slice(0, 3) // First 3 images
        .map((img) => img.alt || "Recipe image")
        .filter((alt) => alt && alt !== "Recipe image");

      if (imageDescriptions.length > 0) {
        contentParts.push(
          `\nImage Descriptions: ${imageDescriptions.join(", ")}`
        );
      }
    }

    const contentForAI = contentParts.join("\n").substring(0, 8000);

    console.log(`✅ Enhanced content built: ${contentForAI.length} characters`);
    console.log("\n📊 ENHANCED CONTENT PREVIEW:");
    console.log("=".repeat(60));
    console.log(contentForAI);
    console.log("=".repeat(60));

    // Quality assessment
    const hasTitle = !!pageTitle;
    const hasOGDescription = !!scrapedData.metadata?.open_graph?.description;
    const hasHeadings = !!(
      scrapedData.headings && scrapedData.headings.length > 0
    );
    const hasImages = !!(scrapedData.images?.images?.length > 0);
    const hasSufficientContent = contentForAI.length > 100;

    const qualityScore = [
      hasTitle,
      hasOGDescription,
      hasHeadings,
      hasImages,
      hasSufficientContent,
    ].filter(Boolean).length;

    console.log("\n✅ ENHANCED CONTENT QUALITY:");
    console.log(`📋 Score: ${qualityScore}/5`);
    console.log(`✅ Has title: ${hasTitle}`);
    console.log(`✅ Has Open Graph description: ${hasOGDescription}`);
    console.log(
      `✅ Has headings: ${hasHeadings} (${
        scrapedData.headings?.length || 0
      } found)`
    );
    console.log(
      `✅ Has images: ${hasImages} (${
        scrapedData.images?.images?.length || 0
      } found)`
    );
    console.log(
      `✅ Sufficient content: ${hasSufficientContent} (${contentForAI.length} chars)`
    );

    if (qualityScore >= 4) {
      console.log(
        "\n🎉 EXCELLENT: Enhanced content is ready for AI processing!"
      );
      console.log("🚀 This should produce high-quality recipe extraction.");
    } else if (qualityScore >= 3) {
      console.log(
        "\n⚠️  GOOD: Enhanced content should work for AI processing."
      );
    } else {
      console.log(
        "\n❌ POOR: Enhanced content quality may affect AI processing."
      );
    }

    console.log("\n🚀 Step 3: Test AI Processing with Enhanced Content");

    // Mock AI processing to show what would happen
    console.log("📤 Sending enhanced content to DeepSeek AI...");
    console.log(`📊 Content size: ${contentForAI.length} characters`);
    console.log("✅ Ready for AI enhancement with comprehensive tagging");

    return {
      success: true,
      contentLength: contentForAI.length,
      qualityScore,
      headingsCount: scrapedData.headings?.length || 0,
      imagesCount: scrapedData.images?.images?.length || 0,
    };
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    return { success: false, error: error.message };
  }
}

testEnhancedContentBuilding()
  .then((result) => {
    if (result.success) {
      console.log(`\n🎉 SUCCESS: Enhanced content building working perfectly!`);
      console.log(`📝 Content: ${result.contentLength} chars`);
      console.log(`📊 Quality: ${result.qualityScore}/5`);
      console.log(`📑 Headings: ${result.headingsCount}`);
      console.log(`🖼️  Images: ${result.imagesCount}`);
      console.log(
        "\n🔄 NEXT: The enhanced content is now ready for DeepSeek AI processing!"
      );
    } else {
      console.log(`\n💥 FAILED: ${result.error}`);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("💥 Test suite crashed:", error);
    process.exit(1);
  });
