#!/usr/bin/env node

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = '/Users/papay0/Dev/lifegorithms/public/images/asia-2023';
const NOTION_URL = 'https://lifegorithms.notion.site/Asia-2023-Singapore-Thailand-South-Korea-Taiwan-Japan-4c0a3b03b39b4396ad636f9dd961d771';

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('============================================================');
console.log('Asia 2023 Image Downloader');
console.log('============================================================\n');

// Step 1: Fetch markdown from Firecrawl
console.log('Fetching page content from Firecrawl...');

const postData = JSON.stringify({
  url: NOTION_URL,
  formats: ['markdown'],
  onlyMainContent: true
});

const options = {
  hostname: 'api.firecrawl.dev',
  port: 443,
  path: '/v1/scrape',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': 'Bearer fc-46c0631ee9d64cd3b71ea32c21f56e95'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      const markdown = result.data?.markdown || result.markdown || result.content || '';

      if (!markdown) {
        console.error('ERROR: No markdown content received');
        console.log('Response:', JSON.stringify(result, null, 2).substring(0, 500));
        process.exit(1);
      }

      console.log(`Received ${(markdown.length / 1024).toFixed(1)}KB of markdown content\n`);

      // Step 2: Extract all image URLs
      console.log('Extracting image URLs...');
      const regex = /https:\/\/lifegorithms\.notion\.site\/image\/https[^\s\)>]*/g;
      const matches = markdown.match(regex) || [];

      // Remove duplicates while preserving order
      const urls = [...new Set(matches)];

      console.log(`Found ${urls.length} unique image URLs\n`);

      if (urls.length === 0) {
        console.log('No images found!');
        process.exit(0);
      }

      // Step 3: Download all images
      console.log('Downloading images...\n');
      let downloaded = 0;
      let failed = 0;

      urls.forEach((url, index) => {
        const imageNum = index + 1;
        const filename = `image-${imageNum}.jpg`;
        const filepath = path.join(OUTPUT_DIR, filename);

        process.stdout.write(`[${String(imageNum).padStart(3)}/${urls.length}] ${filename}... `);

        try {
          execSync(`curl -s -L -m 30 -H "User-Agent: Mozilla/5.0" -o "${filepath}" "${url}"`, {
            timeout: 35000,
            stdio: 'pipe'
          });

          // Verify download
          if (fs.existsSync(filepath)) {
            const stats = fs.statSync(filepath);
            if (stats.size > 0) {
              console.log(`✓ (${(stats.size / 1024).toFixed(1)}KB)`);
              downloaded++;
            } else {
              console.log('✗ (empty)');
              failed++;
              fs.unlinkSync(filepath);
            }
          } else {
            console.log('✗ (not created)');
            failed++;
          }
        } catch (error) {
          console.log(`✗ (error)`);
          failed++;
          if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        }
      });

      console.log('\n============================================================');
      console.log(`COMPLETE!`);
      console.log(`Downloaded: ${downloaded}/${urls.length} images`);
      console.log(`Failed: ${failed}`);
      console.log(`Location: ${OUTPUT_DIR}`);
      console.log('============================================================\n');

    } catch (error) {
      console.error('ERROR parsing response:', error.message);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('ERROR making request:', error.message);
  process.exit(1);
});

req.write(postData);
req.end();
