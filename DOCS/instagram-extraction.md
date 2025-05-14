# Instagram Recipe Extraction Feature

## Overview

This feature extracts recipe content from Instagram posts by using a backend API that directly fetches data from Instagram through the `instaloader` Python library. The system provides real recipe extraction with fallback to AI-based extraction when the backend is unavailable.

## Architecture

The feature consists of several components:

1. **Backend API Server**: A Node.js Express server that interfaces with the Python Instaloader library
2. **Python Extraction Script**: Uses Instaloader to fetch and parse Instagram content
3. **Frontend Bridge Service**: JavaScript interface to the backend API
4. **Recipe Context Integration**: Integration with the app's main context for recipe management

## How It Works

1. When a user enters an Instagram URL, the app first checks if the backend API is available
2. If available, it sends the URL to the backend for direct extraction
3. The backend extracts the real content from Instagram (caption, media, user info)
4. The extracted data is returned to the frontend where it's analyzed to extract recipe details
5. If the backend is unavailable, the app falls back to using AI-based extraction

## Key Files

- `backend-example/simple_server.js` - Express server that handles API requests
- `backend-example/test_instaloader.py` - Python script using Instaloader to extract data
- `src/services/instaloaderBridge.ts` - Frontend service that connects to the backend API
- `src/context/RecipeContext.tsx` - Context handling recipe extraction and processing

## Setup Instructions

### Backend Setup

1. Install Node.js dependencies:

   ```
   cd backend-example
   npm install express cors
   ```

2. Install Python and Instaloader:

   ```
   pip install instaloader
   ```

3. Start the backend server:
   ```
   cd backend-example
   ./restart.sh
   ```

### Environment Configuration

Create a `.env` file in the project root with:

```
VITE_INSTALOADER_API_URL=http://localhost:3001/api
```

## Technical Details

### API Endpoints

- `GET /api/status` - Check if the API is online and properly configured
- `POST /api/extract` - Extract data from an Instagram post URL

### Authentication

For improved extraction reliability, you can provide an Instagram session ID:

```
export INSTA_SESSION_ID="your_instagram_session_id"
```

### Error Handling

The system includes robust error handling:

1. Checks if Python and Instaloader are available
2. Validates Instagram URLs
3. Provides detailed error messages when extraction fails
4. Falls back to AI-based extraction when direct extraction isn't possible

## Instaloader Version Compatibility

The extraction script has been updated to support multiple versions of Instaloader. Instagram frequently changes their API structure, which can cause the Instaloader library to update how it accesses different attributes.

### Current Compatibility

- **Tested with**: Instaloader v4.9.x and later
- **Profile Picture Access**: Handles both `post.owner.profile_pic_url` (newer versions) and `post.owner_profile_pic_url` (older versions)
- **Attribute Resilience**: Contains fallbacks and error handling for missing or renamed attributes

### Troubleshooting Instagram Extraction

If you encounter extraction issues:

1. **Check Instaloader Version**: Run `pip show instaloader` to see your installed version
2. **Update Instaloader**: Use `pip install --upgrade instaloader` to get the latest version
3. **Check Server Logs**: Look for attribute errors in `backend-example/server.log`
4. **Test Direct Extraction**: Try `python test_instaloader.py <instagram-post-shortcode>` to debug specific posts
5. **Session ID**: For private posts, ensure you've provided a valid Instagram session ID

### Common Issues

- **Profile Picture Missing**: May appear as null in extracted data but won't prevent recipe extraction
- **Rate Limiting**: Instagram may temporarily block extraction if too many requests are made
- **Private Posts**: Require a valid Instagram session ID for extraction

## Recent Improvements

1. Added version compatibility with multiple Instaloader versions
2. Improved error handling for Instagram API attribute changes
3. Enhanced logging for debugging API structure changes
4. Added fallback mechanisms for profile picture access
5. Improved documentation for troubleshooting extraction issues
6. Removed dependency on specific attribute structures
