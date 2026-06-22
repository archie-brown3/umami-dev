#!/bin/bash

# Instagram Scraping Test with curl
# Usage: ./scripts/test-instagram-curl.sh [instagram-url]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API endpoint
API_URL="https://recipeextractionservice.onrender.com"

echo -e "${BLUE}🧪 Instagram Scraping Test with curl${NC}"
echo "=================================================="

# Check if URL is provided
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Error: Please provide an Instagram URL${NC}"
    echo "Usage: $0 <instagram-url>"
    echo ""
    echo "Example:"
    echo "  $0 'https://www.instagram.com/p/ABC123/'"
    exit 1
fi

INSTAGRAM_URL="$1"

# Validate Instagram URL
if [[ ! "$INSTAGRAM_URL" == *"instagram.com"* ]]; then
    echo -e "${RED}❌ Error: URL is not an Instagram URL${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Testing URL: $INSTAGRAM_URL${NC}"
echo ""

# Test the health endpoint first
echo -e "${BLUE}🔍 Testing API health...${NC}"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")

if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ API is healthy${NC}"
else
    echo -e "${RED}❌ API health check failed (status: $HEALTH_STATUS)${NC}"
    exit 1
fi

echo ""

# Create the JSON payload
JSON_PAYLOAD=$(cat <<EOF
{
  "url": "$INSTAGRAM_URL",
  "options": {
    "text": true,
    "metadata": true,
    "images": true,
    "headings": true,
    "links": true,
    "tables": false,
    "forms": false
  }
}
EOF
)

echo -e "${BLUE}📡 Making request to scrape-web API...${NC}"
echo ""

# Make the API request and save response
RESPONSE_FILE="/tmp/instagram_scrape_response.json"
HTTP_STATUS=$(curl -s -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD" \
  -o "$RESPONSE_FILE" \
  "$API_URL/api/scrape-web")

echo -e "${YELLOW}📊 HTTP Status: $HTTP_STATUS${NC}"

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Request successful${NC}"
    echo ""
    
    # Parse and display key information
    echo -e "${BLUE}📋 EXTRACTION RESULTS:${NC}"
    echo "------------------------------"
    
    # Extract username from URL
    USERNAME=$(echo "$INSTAGRAM_URL" | grep -oP 'instagram\.com/\K[^/]+')
    echo -e "${YELLOW}👤 Username:${NC} $USERNAME"
    
    # Extract data using jq if available
    if command -v jq &> /dev/null; then
        # Text information
        WORD_COUNT=$(jq -r '.text.word_count // 0' "$RESPONSE_FILE")
        TEXT_LENGTH=$(jq -r '.text.full_text | length // 0' "$RESPONSE_FILE")
        echo -e "${YELLOW}📄 Word Count:${NC} $WORD_COUNT"
        echo -e "${YELLOW}📝 Text Length:${NC} $TEXT_LENGTH characters"
        
        # Image information
        IMAGE_COUNT=$(jq -r '.images.total_images // 0' "$RESPONSE_FILE")
        echo -e "${YELLOW}🖼️  Total Images:${NC} $IMAGE_COUNT"
        
        # Metadata
        TITLE=$(jq -r '.metadata.title // "none"' "$RESPONSE_FILE")
        echo -e "${YELLOW}📄 Page Title:${NC} $TITLE"
        
        # Open Graph data
        OG_DESCRIPTION=$(jq -r '.metadata.open_graph.description // "none"' "$RESPONSE_FILE")
        OG_IMAGE=$(jq -r '.metadata.open_graph.image // "none"' "$RESPONSE_FILE")
        
        echo ""
        echo -e "${BLUE}🔍 OPEN GRAPH DATA:${NC}"
        echo "------------------------------"
        echo -e "${YELLOW}Description:${NC} $OG_DESCRIPTION"
        echo -e "${YELLOW}Image:${NC} $OG_IMAGE"
        
        # Caption extraction (same logic as in the app)
        CAPTION=$(jq -r '
          if .metadata.open_graph.description then
            .metadata.open_graph.description
          elif .metadata.description then
            .metadata.description
          elif .text.full_text then
            (.text.full_text | split("\n") | map(select(length > 0)) | .[0:3] | join(" ") | .[0:500])
          else
            "No caption extracted"
          end
        ' "$RESPONSE_FILE")
        
        echo ""
        echo -e "${BLUE}📝 EXTRACTED CAPTION:${NC}"
        echo "------------------------------"
        echo "$CAPTION"
        
        # First image URL
        FIRST_IMAGE=$(jq -r '.images.images[0].url // "none"' "$RESPONSE_FILE")
        if [ "$FIRST_IMAGE" != "none" ]; then
            echo ""
            echo -e "${BLUE}🔗 THUMBNAIL URL:${NC}"
            echo "------------------------------"
            echo "$FIRST_IMAGE"
        fi
        
    else
        echo -e "${YELLOW}⚠️  jq not installed - showing raw response:${NC}"
        echo ""
        cat "$RESPONSE_FILE" | head -20
        echo "..."
    fi
    
    echo ""
    echo -e "${GREEN}✅ Test completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}💡 Full response saved to: $RESPONSE_FILE${NC}"
    echo -e "${BLUE}💡 To view full response: cat $RESPONSE_FILE | jq${NC}"
    
else
    echo -e "${RED}❌ Request failed${NC}"
    echo ""
    echo -e "${YELLOW}Response:${NC}"
    cat "$RESPONSE_FILE"
    exit 1
fi

echo ""
echo -e "${BLUE}🎉 Instagram scraping test completed!${NC}" 