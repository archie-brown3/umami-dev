// Test the exact URL that failed in integration
const testUrl = "https://www.bbcgoodfood.com/recipes/beef-steak-tartare";

async function testExactFailingUrl() {
  console.log("🔍 Testing Exact URL That Failed in Integration");
  console.log("=".repeat(50));
  console.log(`URL: ${testUrl}`);

  try {
    // Direct fetch test
    const response = await fetch(testUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    console.log(
      `📊 Response Status: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log("❌ 404 NOT FOUND - This URL does not exist!");
        console.log("🔍 Let's check if there's a redirect or different URL...");

        // Try the working URL format
        console.log("\n🔄 Trying corrected URL format...");
        const correctedUrl =
          "https://www.bbcgoodfood.com/recipes/steak-tartare";
        const correctedResponse = await fetch(correctedUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            DNT: "1",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
          },
        });

        console.log(
          `✅ Corrected URL Status: ${correctedResponse.status} ${correctedResponse.statusText}`
        );

        if (correctedResponse.ok) {
          console.log("🎉 SOLUTION FOUND: The URL was incorrect!");
          console.log(
            "❌ Failing URL: https://www.bbcgoodfood.com/recipes/beef-steak-tartare"
          );
          console.log(
            "✅ Working URL: https://www.bbcgoodfood.com/recipes/steak-tartare"
          );
          console.log("\n💡 The integration test was using a wrong URL!");
        }

        return;
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`📄 HTML Retrieved: ${html.length} characters`);

    // Quick structured data check
    const jsonLdMatches = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis
    );
    console.log(
      `📋 JSON-LD Scripts Found: ${jsonLdMatches ? jsonLdMatches.length : 0}`
    );

    if (jsonLdMatches && jsonLdMatches.length > 0) {
      console.log("✅ Structured data extraction should work for this URL!");
    } else {
      console.log("❌ No structured data found for this URL");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testExactFailingUrl();
