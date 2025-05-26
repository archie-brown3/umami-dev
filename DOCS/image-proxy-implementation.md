# Image Proxy Implementation for Instagram Recipe Thumbnails

## Overview

This document outlines the implementation of the local image proxy endpoint for handling Instagram recipe thumbnails, replacing the unreliable external proxy services with a more robust local solution.

## Problem Analysis

### Issues Identified

From the application logs, we observed:

1. **High failure rate** with external proxy service (`images.weserv.nl`):

   ```
   LOG [RecipeCard] Image failed to load: https://images.weserv.nl/?url=https%3A%2F%2Finstagram.fltn3-1.fna.fbcdn.net%2F...
   ```

2. **Inconsistent reliability** across different Instagram CDN domains:

   - `instagram.fltn3-1.fna.fbcdn.net` - **Failed**
   - `instagram.fltn3-2.fna.fbcdn.net` - **Failed**
   - `scontent-sea1-1.cdninstagram.com` - **Working with external proxy**

3. **Multiple code paths** handling image URLs inconsistently

## Current Implementation Status ✅ PARTIALLY COMPLETE

### ✅ **Completed Components**

1. **Local Image Proxy Endpoint**:

   - Available at: `${RECIPE_EXTRACTION_SERVICE_URL}/api/image-proxy?url={encoded-url}`
   - Working for some Instagram CDN URLs

2. **Enhanced Image Processing Functions**:

   - `processInstagramImageUrl()` in `services/deepseekservice.ts`
   - `processImageUrl()` in `services/recipeService.ts`
   - `processImageUrl()` in `utils/imageUtils.ts`

3. **Smart Image Selection**:

   - `selectBestInstagramImage()` - Prioritizes high-quality images over video thumbnails
   - `selectBestRecipeImage()` - Analyzes multiple images for recipe relevance
   - `isVideoThumbnail()` - Detects and skips video thumbnails with play icons

4. **Priority System**:
   - **Priority 1**: Local image proxy endpoint (`localhost:3001` or extraction service)
   - **Priority 2**: External proxy service (`images.weserv.nl`)
   - **Priority 3**: Original URL (fallback)

### ⚠️ **Issues Identified**

1. **Inconsistent Application**: Multiple image processing functions with different logic
2. **Mixed Results**: Some images working, others failing despite proxy implementation
3. **Code Duplication**: Similar proxy logic scattered across multiple files

### 📊 **Current Results**

**Working Examples**:

```
✅ http://localhost:3001/api/image-proxy?url=https%3A%2F%2Finstagram.fltn3-1.fna.fbcdn.net%2F...
✅ https://images.weserv.nl/?url=https%3A%2F%2Fscontent-sea1-1.cdninstagram.com%2F...
```

**Failing Examples**:

```
❌ http://localhost:3001/api/image-proxy?url=https%3A%2F%2Finstagram.fltn3-1.fna.fbcdn.net%2F...
❌ http://localhost:3001/api/image-proxy?url=https%3A%2F%2Finstagram.fltn3-2.fna.fbcdn.net%2F...
```

## Root Cause Analysis

### 1. **Recipe Extraction Issue** ❌ CRITICAL

The main issue is **not the image proxy**, but the **recipe extraction process**:

- **Problem**: Web scraper only extracts plain text, missing structured JSON-LD data
- **Impact**: AI creates generic ingredients instead of precise quantities
- **Example**:
  - **Expected**: `"1 pound lean ground beef"`
  - **Actual**: `"1 Ground beef"`

### 2. **Image Proxy Inconsistency** ⚠️ MODERATE

Multiple functions handling image URLs differently:

- `deepseekservice.ts` - Uses extraction service URL
- `recipeService.ts` - Uses extraction service URL
- `recipeExtractor.ts` - Uses extraction service URL
- Different error handling and fallback strategies

## Required Fixes

### 1. **Fix Recipe Extraction** 🔧 HIGH PRIORITY

**Problem**: Web scraper missing structured data
**Solution**: Enhance scraper to parse JSON-LD structured data

```bash
# Current scraper output (plain text only)
curl -X POST "https://recipeextractionservice.onrender.com/api/scrape-web" \
  -d '{"url": "https://feelgoodfoodie.net/recipe/ground-beef-tacos/"}' \
  | jq '.text.full_text'

# Needed: Parse JSON-LD structured data
curl -s "https://feelgoodfoodie.net/recipe/ground-beef-tacos/" \
  | grep -o '<script type="application/ld+json"[^>]*>.*</script>' \
  | jq '.["@graph"][] | select(.["@type"] == "Recipe")'
```

### 2. **Consolidate Image Processing** 🔧 MEDIUM PRIORITY

**Problem**: Multiple inconsistent image processing functions
**Solution**: Create single, reliable image processing utility

**Proposed Structure**:

```typescript
// utils/imageProcessor.ts
export function processRecipeImageUrl(imageUrl: string): string {
  // Single source of truth for image URL processing
  // 1. Check if already proxied
  // 2. Apply local proxy for Instagram CDN
  // 3. Fallback to external proxy
  // 4. Return original URL as last resort
}
```

## Implementation Plan

### Phase 1: Fix Recipe Extraction ⏳

1. **Enhance web scraper** to extract JSON-LD structured data
2. **Prioritize structured data** over plain text analysis
3. **Test with multiple recipe websites** to ensure compatibility

### Phase 2: Consolidate Image Processing ⏳

1. **Create unified image processor** utility
2. **Update all services** to use single processor
3. **Add comprehensive error handling** and logging

### Phase 3: Testing & Validation ⏳

1. **Test recipe extraction** with structured data websites
2. **Verify image loading** across all Instagram CDN domains
3. **Performance testing** of proxy endpoints

## Expected Behavior

### Recipe Creation from URL

1. **Extract structured data** (JSON-LD) when available
2. **Process image URL** through local proxy for Instagram CDN
3. **Save to Supabase** with proper data types and quantities
4. **Fallback to AI analysis** only when structured data unavailable

### Image Loading

1. **Instagram CDN URLs**: Always use local proxy endpoint
2. **Other images**: Use original URL unless CORS issues detected
3. **Fallback strategy**: Local proxy → External proxy → Original → Placeholder
4. **Error handling**: Log failures but don't crash app

## Testing Commands

```bash
# Test structured data extraction
curl -s "https://feelgoodfoodie.net/recipe/ground-beef-tacos-napa-cabbage-guacamole/" \
  | grep -o '<script type="application/ld+json"[^>]*>.*</script>' \
  | sed 's/<[^>]*>//g' | jq '.["@graph"][] | select(.["@type"] == "Recipe")'

# Test image proxy endpoint
curl -I "https://recipeextractionservice.onrender.com/api/image-proxy?url=https%3A%2F%2Finstagram.fltn3-1.fna.fbcdn.net%2Ftest.jpg"

# Test web scraper
curl -X POST "https://recipeextractionservice.onrender.com/api/scrape-web" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://feelgoodfoodie.net/recipe/ground-beef-tacos-napa-cabbage-guacamole/"}'
```

## Success Metrics

1. **Recipe Quality**: Ingredients have proper quantities and units
2. **Image Loading**: >90% success rate for Instagram images
3. **Performance**: Recipe extraction <30 seconds
4. **Error Handling**: Graceful fallbacks, no app crashes

## URL Patterns

### Local Proxy URLs

```

```
