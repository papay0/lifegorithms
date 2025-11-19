#!/usr/bin/env python3
import re

# Paste the markdown content from Firecrawl here
# This script will extract all image URLs

markdown = """
[PASTE MARKDOWN FROM FIRECRAWL HERE - OR READ FROM STDIN]
"""

# If reading from a file:
import sys
if len(sys.argv) > 1:
    with open(sys.argv[1], 'r') as f:
        markdown = f.read()
else:
    markdown = sys.stdin.read()

# Extract all notion image URLs
pattern = r'https://lifegorithms\.notion\.site/image/https[^\s\)>]*'
urls = re.findall(pattern, markdown)

# Remove duplicates while preserving order
seen = set()
unique_urls = []
for url in urls:
    if url not in seen:
        seen.add(url)
        unique_urls.append(url)

print(f"Found {len(unique_urls)} unique image URLs")
print()

# Output each URL
for url in unique_urls:
    print(url)
