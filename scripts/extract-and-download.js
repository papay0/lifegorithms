#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// The markdown content from Firecrawl (truncated for brevity, but this shows the pattern)
const sampleMarkdown = `
![](https://lifegorithms.notion.site/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F7e0fb484-b0f7-4486-b8d6-432096ee36ba%2F8604fb74-ba2d-4f72-9560-c2e3b514d399%2FIMG_5265_copy.jpeg?table=block&id=56b89bc2-c95c-47c1-b5fb-9f5ef0de2806&spaceId=7e0fb484-b0f7-4486-b8d6-432096ee36ba&width=1670&userId=&cache=v2)
`;

const OUTPUT_DIR = '/Users/papay0/Dev/lifegorithms/public/images/asia-2023';

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Using cached markdown from Firecrawl MCP...');

// I need to call Firecrawl again to get the full markdown
// Let me use the mcp__firecrawl tool output directly
console.log('Please run this with the full markdown as input');
console.log('For now, testing with 3 sample URLs...');

const testUrls = [
  'https://lifegorithms.notion.site/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F7e0fb484-b0f7-4486-b8d6-432096ee36ba%2F8604fb74-ba2d-4f72-9560-c2e3b514d399%2FIMG_5265_copy.jpeg?table=block&id=56b89bc2-c95c-47c1-b5fb-9f5ef0de2806&spaceId=7e0fb484-b0f7-4486-b8d6-432096ee36ba&width=1670&userId=&cache=v2',
  'https://lifegorithms.notion.site/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F7e0fb484-b0f7-4486-b8d6-432096ee36ba%2F0d27aed7-dbd5-467f-8b0c-bbbe06a8dceb%2FIMG_5267_copy.jpeg?table=block&id=f6cdd332-3e55-4ba4-a4ee-4071939dfe07&spaceId=7e0fb484-b0f7-4486-b8d6-432096ee36ba&width=1670&userId=&cache=v2',
  'https://lifegorithms.notion.site/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F7e0fb484-b0f7-4486-b8d6-432096ee36ba%2F5986ed98-c894-45f6-a630-b6ddaab780fc%2FIMG_5343_copy.jpeg?table=block&id=274a3a57-7024-4556-b796-5d0d3e8b5a5e&spaceId=7e0fb484-b0f7-4486-b8d6-432096ee36ba&width=1670&userId=&cache=v2'
];

let downloaded = 0;
let failed = 0;

console.log(`Downloading ${testUrls.length} test images...`);

testUrls.forEach((url, index) => {
  const imageNum = index + 1;
  const filename = `image-${imageNum}.jpg`;
  const filepath = path.join(OUTPUT_DIR, filename);

  process.stdout.write(`[${imageNum}/${testUrls.length}] ${filename}... `);

  try {
    execSync(`curl -s -L -m 30 -H "User-Agent: Mozilla/5.0" -o "${filepath}" "${url}"`, {
      timeout: 35000
    });

    if (fs.existsSync(filepath) && fs.statSync(filepath).size > 0) {
      const size = fs.statSync(filepath).size;
      console.log(`✓ (${(size / 1024).toFixed(1)}KB)`);
      downloaded++;
    } else {
      console.log('✗');
      failed++;
    }
  } catch (error) {
    console.log('✗');
    failed++;
  }
});

console.log(`\nTest complete: ${downloaded}/${testUrls.length} downloaded, ${failed} failed`);
