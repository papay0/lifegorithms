#!/bin/bash

OUTPUT_DIR="/Users/papay0/Dev/lifegorithms/public/images/asia-2023"
mkdir -p "$OUTPUT_DIR"

echo "============================================================"
echo "Downloading Asia 2023 images"
echo "============================================================"

# Fetch the Notion page HTML
echo "Fetching page HTML..."
HTML=$(curl -s -L -H "User-Agent: Mozilla/5.0" "https://lifegorithms.notion.site/Asia-2023-Singapore-Thailand-South-Korea-Taiwan-Japan-4c0a3b03b39b4396ad636f9dd961d771")

# Extract all unique image URLs
echo "Extracting image URLs..."
URLS=$(echo "$HTML" | grep -o 'https://lifegorithms\.notion\.site/image/https[^"]*' | sort -u)

# Count URLs
COUNT=$(echo "$URLS" | wc -l | tr -d ' ')
echo "Found $COUNT unique image URLs"

if [ "$COUNT" -eq 0 ]; then
  echo "No images found!"
  exit 1
fi

# Download each image
COUNTER=1
DOWNLOADED=0
FAILED=0

echo "$URLS" | while read -r URL; do
  if [ -z "$URL" ]; then
    continue
  fi

  FILENAME="image-$COUNTER.jpg"
  FILEPATH="$OUTPUT_DIR/$FILENAME"

  printf "[%3d/%3d] %s... " "$COUNTER" "$COUNT" "$FILENAME"

  curl -s -L -m 30 -H "User-Agent: Mozilla/5.0" -o "$FILEPATH" "$URL" 2>/dev/null

  if [ -f "$FILEPATH" ] && [ -s "$FILEPATH" ]; then
    SIZE=$(du -h "$FILEPATH" | cut -f1)
    echo "✓ ($SIZE)"
    DOWNLOADED=$((DOWNLOADED + 1))
  else
    echo "✗"
    FAILED=$((FAILED + 1))
    rm -f "$FILEPATH"
  fi

  COUNTER=$((COUNTER + 1))
done

echo ""
echo "============================================================"
echo "Complete! Downloaded: $DOWNLOADED/$COUNT images"
echo "Location: $OUTPUT_DIR"
echo "============================================================"
