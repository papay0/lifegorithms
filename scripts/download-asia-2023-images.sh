#!/bin/bash

# Create output directory
OUTPUT_DIR="/Users/papay0/Dev/lifegorithms/public/images/asia-2023"
mkdir -p "$OUTPUT_DIR"

# Fetch markdown using Firecrawl
echo "Fetching markdown from Firecrawl..."
MARKDOWN=$(curl -s -X POST "https://api.firecrawl.dev/v1/scrape" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fc-46c0631ee9d64cd3b71ea32c21f56e95" \
  -d '{"url":"https://lifegorithms.notion.site/Asia-2023-Singapore-Thailand-South-Korea-Taiwan-Japan-4c0a3b03b39b4396ad636f9dd961d771","formats":["markdown"]}' | \
  jq -r '.data.markdown // .markdown // ""')

# Extract image URLs and download them
echo "Extracting and downloading images..."
COUNTER=1

# Extract all Notion image URLs from markdown
echo "$MARKDOWN" | grep -o 'https://lifegorithms\.notion\.site/image/[^)]*' | sort -u | while read -r IMAGE_URL; do
  echo "[$COUNTER] Downloading image $COUNTER..."

  curl -s -L -H "User-Agent: Mozilla/5.0" \
    -o "$OUTPUT_DIR/image-$COUNTER.jpg" \
    "$IMAGE_URL"

  if [ $? -eq 0 ] && [ -s "$OUTPUT_DIR/image-$COUNTER.jpg" ]; then
    echo "  ✓ Downloaded: image-$COUNTER.jpg ($(du -h "$OUTPUT_DIR/image-$COUNTER.jpg" | cut -f1))"
  else
    echo "  ✗ Failed: image-$COUNTER.jpg"
  fi

  COUNTER=$((COUNTER + 1))
done

echo ""
echo "============================================================"
echo "Download complete! Total images: $((COUNTER - 1))"
echo "Location: $OUTPUT_DIR"
echo "============================================================"
