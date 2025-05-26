# Recipe Extraction Issues - Comprehensive Analysis

## Issue Summary

After testing the web scraper with the Feel Good Foodie recipe URL, two critical issues were identified:

### 1. **Missing Structured Data Extraction** ❌ CRITICAL

- **Problem**: Web scraper only extracts plain text, missing JSON-LD structured data
- **Impact**: AI creates generic ingredients like "1 Ground beef" instead of "1 pound lean ground beef"
- **Root Cause**: Scraper doesn't parse `<script type="application/ld+json">` elements

### 2. **Inconsistent Image Proxy Application** ⚠️ MODERATE

- **Problem**: Local image proxy not consistently applied to all Instagram CDN URLs
- **Impact**: Many recipe images fail to load despite proxy implementation
- **Root Cause**: Multiple code paths handling image URLs differently

## Detailed Analysis

### Web Scraper Test Results

**URL Tested**: `https://feelgoodfoodie.net/recipe/ground-beef-tacos-napa-cabbage-guacamole/`

**Current Extraction** (Plain Text Only):

```
"Ground Beef Tacos {Easy 10 Minute Recipe!} - Feel Good Foodie Skip to contentHome Recipes Dinners Tacos/Fajitas... Chili powder Cumin Garlic powder Mexican oregano Salt and pepper..."
```

**Available Structured Data** (JSON-LD):

```json
{
  "name": "Ground Beef Tacos",
  "recipeIngredient": [
    "1 tablespoon olive oil",
    "1 pound lean ground beef",
    "2 teaspoons chili powder",
    "2 teaspoons cumin",
    "½ teaspoon oregano",
    "½ teaspoon garlic powder",
    "½ teaspoon salt",
    "½ teaspoon black pepper",
    "2 tablespoons tomato paste",
    "½ cup water"
  ],
  "recipeInstructions": [
    {
      "text": "Heat the olive oil in skillet over medium high heat. Add the ground beef and cook until browned, about 5-7 minutes. Drain any fat."
    },
    {
      "text": "Add the chili powder, cumin, dried oregano, garlic powder, salt, pepper, tomato paste and water. Stir to combine and continue cooking over medium-low heat until the sauce has thickened, about 3-5 minutes"
    },
    {
      "text": "Serve warm over tortillas with lettuce, tomatoes, cheese and red onions, or your other desired toppings."
    }
  ],
  "prepTime": "PT15M",
  "cookTime": "PT10M",
  "recipeYield": ["8", "8 servings"]
}
```

### Image Proxy Status

**Working Examples**:

- `http://localhost:3001/api/image-proxy?url=https%3A%2F%2Finstagram.fltn3-1.fna.fbcdn.net%2F...`
- `https://images.weserv.nl/?url=https%3A%2F%2Fscontent-sea1-1.cdninstagram.com%2F...`

**Failing Examples**:

- Multiple Instagram CDN URLs still failing despite proxy implementation
- Inconsistent application across different extraction paths

## Required Fixes

### 1. **Enhance Web Scraper to Extract JSON-LD Data** 🔧

**Current**: Only extracts plain text content
**Needed**: Parse and prioritize structured recipe data

**Implementation**:

- Add JSON-LD parsing to web scraper API
- Prioritize structured data over plain text
- Fallback to text analysis only when structured data unavailable

### 2. **Standardize Image Proxy Application** 🔧

**Current**: Multiple inconsistent image processing functions
**Needed**: Single, reliable image URL processing pipeline

**Implementation**:

- Consolidate image processing logic
- Ensure all extraction paths use same proxy logic
- Add better error handling and fallbacks

### 3. **Update Recipe Extraction Service** 🔧

**Current**: Relies on AI to parse unstructured text
**Needed**: Use structured data when available, AI as fallback

**Implementation**:

- Modify extraction service to check for JSON-LD first
- Transform structured data to Recipe format
- Use AI analysis only for unstructured content

## Expected Behavior (Per Rules.md)

### Image URL Processing

1. **New recipes**: Images should be processed through local proxy endpoint
2. **Instagram CDN URLs**: Must use proxy to bypass CORS restrictions
3. **Fallback strategy**: External proxy → Original URL → Placeholder
4. **Storage**: Processed URLs saved to Supabase with proper fallbacks

### Recipe Data Processing

1. **Primary source**: Structured data (JSON-LD, microdata) when available
2. **Secondary source**: AI analysis of text content
3. **Storage**: All recipe data saved to Supabase following database schema
4. **Validation**: Ensure required fields (title, ingredients, instructions) present

## Implementation Priority

1. **HIGH**: Fix structured data extraction (affects recipe quality)
2. **MEDIUM**: Standardize image proxy application (affects user experience)
3. **LOW**: Add better error handling and logging (affects debugging)

## Testing Requirements

1. **Recipe Extraction**: Test with multiple recipe websites
2. **Image Loading**: Verify proxy works for all Instagram CDN domains
3. **Data Quality**: Ensure extracted recipes have proper quantities and units
4. **Error Handling**: Test fallback behavior when structured data unavailable
