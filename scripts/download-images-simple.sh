#!/bin/bash

# Articles to process
declare -A ARTICLES
ARTICLES["2023-year-in-review"]="https://lifegorithms.notion.site/2023-Year-in-Review-23b9e995628b41aba69c09179f1a8334"
ARTICLES["asia-2023"]="https://lifegorithms.notion.site/Asia-2023-Singapore-Thailand-South-Korea-Taiwan-Japan-4c0a3b03b39b4396ad636f9dd961d771"
ARTICLES["2022-year-in-review"]="https://lifegorithms.notion.site/2022-Year-in-Review-369ea5104bde46b9abdd53e386348c06"
ARTICLES["2021-year-in-review"]="https://lifegorithms.notion.site/2021-Year-in-Review-8f562e2250e04addb00c8f4a8ea7a378"

for folder in "${!ARTICLES[@]}"; do
  url="${ARTICLES[$folder]}"
  echo "============================================================"
  echo "Processing: $folder"
  echo "URL: $url"
  echo "============================================================"

  # Create output directory
  output_dir="/Users/papay0/Dev/lifegorithms/public/images/$folder"
  mkdir -p "$output_dir"

  # Fetch markdown using Firecrawl API
  echo "Fetching markdown from Firecrawl..."
  markdown=$(curl -s -X POST "https://api.firecrawl.dev/v1/scrape" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer fc-46c0631ee9d64cd3b71ea32c21f56e95" \
    -d "{\"url\":\"$url\",\"formats\":[\"markdown\"]}" | \
    jq -r '.data.markdown // .markdown // ""')

  if [ -z "$markdown" ] || [ "$markdown" = "null" ]; then
    echo "ERROR: Failed to fetch markdown"
    continue
  fi

  # Extract image URLs and download them
  echo "Extracting and downloading images..."
  counter=1

  # Extract all Notion image URLs
  echo "$markdown" | grep -o 'https://lifegorithms\.notion\.site/image/[^)]*' | while read -r image_url; do
    echo "  Downloading image $counter..."
    curl -L -H "User-Agent: Mozilla/5.0" \
      -o "$output_dir/image-$counter.jpg" \
      "$image_url" 2>/dev/null

    if [ $? -eq 0 ]; then
      echo "  ✓ Downloaded: image-$counter.jpg"
    else
      echo "  ✗ Failed: image-$counter.jpg"
    fi

    counter=$((counter + 1))
  done

  echo "✓ Completed: $folder"
  echo ""
  sleep 2
done

echo "============================================================"
echo "All downloads complete!"
echo "============================================================"
