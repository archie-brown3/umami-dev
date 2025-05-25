# Instagram Scraping Tests

This document explains how to test the new Instagram scraping functionality using the `/scrape-web` endpoint instead of the old `/extract` endpoint.

## What Changed

- ✅ **COMMENTED OUT**: Old `/extract` endpoint usage for Instagram
- ✅ **NEW**: Using `/scrape-web` endpoint for Instagram posts
- ✅ **FOCUS**: Extract caption, username, and post thumbnail

## Testing Options

### 1. React Native Component (In-App Testing)

Navigate to `app/instagram-test.tsx` in your app to test Instagram scraping with a visual interface.

**Features:**

- Test single Instagram URLs
- Test multiple URLs at once
- View extracted data (caption, username, thumbnail)
- See detailed service logs
- Visual results display

**Usage:**

1. Add the screen to your navigation if needed
2. Enter an Instagram URL
3. Tap "Test Single URL"
4. Review results and logs

### 2. Node.js Command Line Script

**Location:** `scripts/test-instagram-scraping.js`

**Usage:**

```bash
node scripts/test-instagram-scraping.js "https://www.instagram.com/p/ABC123/"
```

**Features:**

- Quick command-line testing
- Detailed output with extracted data
- Raw response analysis
- Metadata inspection

### 3. Bash/curl Script

**Location:** `scripts/test-instagram-curl.sh`

**Usage:**

```bash
./scripts/test-instagram-curl.sh "https://www.instagram.com/p/ABC123/"
```

**Features:**

- Pure curl-based testing
- No Node.js dependencies
- Color-coded output
- JSON parsing with `jq` (optional)

## What Gets Extracted

The new scraping approach attempts to extract:

### 1. **Caption**

Priority order:

1. `metadata.open_graph.description`
2. `metadata.description`
3. First 3 lines of `text.full_text` (truncated to 500 chars)
4. Fallback: "No caption extracted"

### 2. **Username**

- Extracted from URL pattern: `instagram.com/USERNAME/`
- Fallback: "unknown"

### 3. **Thumbnail**

- First image from `images.images[0].url`
- Fallback: `null`

## Sample Test URLs

For testing, you can use these sample Instagram URL patterns:

```
https://www.instagram.com/p/ABC123/
https://www.instagram.com/p/DEF456/
https://www.instagram.com/reel/GHI789/
```

_Note: Replace with actual Instagram post URLs_

## Expected Output Structure

```json
{
  "success": true,
  "message": "Instagram scraping test successful",
  "extractedData": {
    "caption": "Recipe caption text here...",
    "username": "chef_username",
    "thumbnail": "https://instagram.com/image.jpg"
  },
  "scrapedData": {
    "text": { "full_text": "...", "word_count": 150 },
    "metadata": { "title": "...", "open_graph": {...} },
    "images": { "total_images": 3, "images": [...] }
  }
}
```

## Optimization Process

Based on test results, you can optimize the extraction by:

### 1. **Analyzing Raw Data**

Look at the `scrapedData` structure to identify:

- Where Instagram actually stores the caption
- Image URL patterns
- Metadata availability

### 2. **Improving Caption Extraction**

Modify the caption extraction logic in:

- `services/deepseekservice.ts` (line ~560)
- `services/recipeExtractor.ts` (line ~125)

### 3. **Enhancing Username Detection**

Improve the regex pattern:

```javascript
const username = url.match(/instagram\.com\/([^\/\?]+)/i)?.[1] || "unknown";
```

### 4. **Better Thumbnail Selection**

Analyze image arrays to find the best thumbnail:

```javascript
const thumbnail =
  scrapedData.images?.images?.find((img) => img.width > 300 && img.height > 300)
    ?.url || scrapedData.images?.images?.[0]?.url;
```

## Testing Workflow

1. **Start with curl script** for quick API validation
2. **Use Node.js script** for detailed analysis
3. **Test in app** for full integration testing
4. **Analyze results** and identify patterns
5. **Optimize extraction logic** based on findings
6. **Test multiple URLs** to validate improvements

## Common Issues & Solutions

### Issue: No caption extracted

**Check:**

- Is `metadata.open_graph.description` present?
- Is `text.full_text` populated?
- Are there alternative metadata fields?

### Issue: No thumbnail found

**Check:**

- Image array structure in `images.images`
- Alternative image sources in metadata
- Instagram-specific image patterns

### Issue: Username extraction fails

**Check:**

- URL format variations (reels, stories, etc.)
- Special characters in usernames
- URL parameters or fragments

## Next Steps

After running tests:

1. **Document findings** in test results
2. **Identify successful patterns** across different posts
3. **Update extraction logic** based on patterns
4. **Create fallback strategies** for edge cases
5. **Test with various Instagram content types** (posts, reels, stories)

## Integration with Recipe Analysis

Once Instagram data is extracted, it flows into the existing recipe analysis pipeline:

```
Instagram URL → /scrape-web → Extract caption/username/thumbnail → DeepSeek analysis → Recipe structure
```

The extracted caption becomes the `originalText` that gets analyzed by DeepSeek to create structured recipe data.
