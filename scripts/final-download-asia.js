#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// This is the markdown content from Firecrawl MCP - I'll extract URLs from it
const markdown = `[The markdown from Firecrawl would go here - but for now I'll use grep to extract from saved file]`;

const OUTPUT_DIR = '/Users/papay0/Dev/lifegorithms/public/images/asia-2023';

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('============================================================');
console.log('Downloading Asia 2023 Images');
console.log('============================================================\n');

// Since the markdown is too long, I'll read it from the Firecrawl cache
// Let me use a simpler approach - extract URLs using grep pattern
const extractCommand = `cat << 'ENDOFMARKDOWN' | grep -o 'https://lifegorithms\\.notion\\.site/image/[^)]*' | sort -u
${fs.readFileSync('/dev/stdin', 'utf8')}
ENDOFMARKDOWN`;

// Actually, let me just use the regex directly on all the markdown we know exists
// I'll manually extract a comprehensive list from what we can see

// Based on the Firecrawl output, extract all image URLs
const urlPattern = /https:\/\/lifegorithms\.notion\.site\/image\/https[^)\s>]*/g;

// For now, let me create a test that downloads all URLs from the markdown
// Since I got the full markdown from Firecrawl, I'll save it and process it

console.log('This script needs the full markdown. Use the all-images download script instead.');
console.log('Run: node scripts/download-all-notion-images.js');
