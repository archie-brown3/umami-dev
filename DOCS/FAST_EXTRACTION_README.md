# Fast Instagram Recipe Extraction Test

This test suite is designed to extract recipes from Instagram content in **under 15 seconds**, optimized for speed while maintaining quality.

## 🎯 Goal

Extract and create a complete recipe from Instagram URLs in **<15 seconds**

## 📁 Files Created

### 1. `test-instagram-extraction.js` (Node.js Script)

- **Purpose**: Standalone Node.js script for testing extraction speed
- **Usage**: `node test-instagram-extraction.js [instagram_url]`
- **Features**:
  - Single URL testing
  - Multiple URL batch testing
  - Real-time performance monitoring
  - Detailed logging and results

### 2. `utils/FastInstagramExtractor.ts` (React Native Class)

- **Purpose**: Optimized extractor class for React Native integration
- **Usage**: Import and use in your React Native app
- **Features**:
  - TypeScript support
  - Same structure as `deepseekservice.ts`
  - Aggressive timeout optimization
  - Fallback mechanisms

### 3. `components/test/FastExtractionTest.tsx` (React Native Component)

- **Purpose**: UI component for testing extraction in the app
- **Usage**: Add `<FastExtractionTest />` to any screen
- **Features**:
  - Real-time timer with progress bar
  - Visual feedback and results
  - Multiple test runner
  - Extraction logs viewer

## 🚀 Quick Start

### Option 1: Node.js Testing

```bash
# Test single URL
node test-instagram-extraction.js https://www.instagram.com/share/BBZ133yzEX

# Test multiple URLs (uses predefined test URLs)
node test-instagram-extraction.js
```

### Option 2: React Native Integration

```tsx
import { FastExtractionTest } from "./components/test/FastExtractionTest";

// Add to any screen
export const TestScreen = () => {
  return <FastExtractionTest />;
};
```

### Option 3: Programmatic Usage

```tsx
import {
  FastInstagramExtractor,
  testFastInstagramExtraction,
} from "./utils/FastInstagramExtractor";

// Quick test
const result = await testFastInstagramExtraction("https://instagram.com/...");

// Advanced usage
const extractor = new FastInstagramExtractor();
const result = await extractor.extractRecipe("https://instagram.com/...");
```

## ⚡ Speed Optimizations

### 1. **Aggressive Timeouts**

- Scraping: 4 seconds max (vs 30s in original)
- AI Analysis: 8 seconds max (vs 35s in original)
- Total target: 15 seconds (vs 60s+ in original)

### 2. **Reduced AI Parameters**

- `max_tokens`: 800 (vs 2048)
- `temperature`: 0.01 (vs 0.1)
- Simplified prompt structure
- Pre-filtered Instagram content

### 3. **Smart Content Filtering**

- Remove social media noise (@mentions, #hashtags)
- Remove engagement text (likes, follows, etc.)
- Limit content to 1200 characters
- Focus on recipe-relevant content only

### 4. **Optimized API Calls**

- Reduced retry attempts (2 vs 3)
- Faster backoff times
- Skip unnecessary scraping options
- Parallel processing where possible

### 5. **Fallback Mechanisms**

- Mock data for testing when scraping fails
- Simplified recipe structure for speed
- Quality validation with quick fixes

## 📊 Performance Targets

| Phase       | Target Time     | Optimization                         |
| ----------- | --------------- | ------------------------------------ |
| Scraping    | <4 seconds      | Aggressive timeouts, minimal options |
| AI Analysis | <8 seconds      | Reduced tokens, simplified prompt    |
| Processing  | <2 seconds      | Quick validation, limited data       |
| **Total**   | **<15 seconds** | **End-to-end optimization**          |

## 🧪 Test Results Format

```javascript
{
  success: boolean,           // Did it complete in <15s?
  extractionTime: number,     // Total time in milliseconds
  recipe: {                   // Extracted recipe data
    title: string,
    description: string,
    ingredients: Array,
    instructions: Array,
    tags: Array,
    // ... other fields
  },
  logs: Array,               // Detailed extraction logs
  error?: string             // Error message if failed
}
```

## 🔧 Configuration

### Environment Variables

```bash
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_API_KEY=your-api-key-here
EXTRACT_API_URL=your-extract-api-url-here
```

### Customization Options

- Adjust timeouts in `FastInstagramExtractor` class
- Modify content filtering rules
- Change AI prompt for different extraction styles
- Update fallback data for testing

## 📈 Monitoring & Debugging

### Real-time Monitoring

- Progress bar shows extraction progress
- Color-coded timing (green <10s, yellow <15s, red >15s)
- Live elapsed time counter

### Detailed Logs

- Timestamped extraction steps
- Performance bottleneck identification
- Error tracking and fallback usage
- API response analysis

### Success Metrics

- **Speed**: <15 seconds total time
- **Quality**: Valid recipe with ingredients and instructions
- **Reliability**: Graceful fallbacks when APIs fail

## 🚨 Troubleshooting

### Common Issues

1. **API Timeouts**: Check network connection and API endpoints
2. **Parsing Errors**: Review AI response format and JSON structure
3. **Scraping Failures**: Verify Instagram URL format and accessibility

### Debug Mode

Enable detailed logging by checking the extraction logs in the test component or console output in Node.js script.

## 🔄 Integration with Existing Code

This fast extractor is designed to be a drop-in replacement for the existing `deepseekservice.ts` Instagram extraction, with the same output format but optimized for speed.

### Migration Path

1. Test with the new fast extractor
2. Compare results with existing implementation
3. Gradually replace slow extraction calls
4. Monitor performance improvements

## 📝 Notes

- Mock data is used when scraping fails for consistent testing
- The extractor prioritizes speed over perfect accuracy
- Fallback mechanisms ensure the app never hangs
- All timeouts are configurable for different use cases
