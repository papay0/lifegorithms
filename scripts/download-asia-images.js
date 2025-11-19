#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = '/Users/papay0/Dev/lifegorithms/public/images/asia-2023';

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Fetching markdown from Firecrawl...');

// Fetch markdown from Firecrawl
const postData = JSON.stringify({
  url: 'https://lifegorithms.notion.site/Asia-2023-Singapore-Thailand-South-Korea-Taiwan-Japan-4c0a3b03b39b4396ad636f9dd961d771',
  formats: ['markdown']
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
      const markdown = result.data?.markdown || result.markdown || '';

      if (!markdown) {
        console.error('No markdown content received');
        process.exit(1);
      }

      console.log('Extracting image URLs...');

      // Extract all Notion image URLs
      const regex = /https:\/\/lifegorithms\.notion\.site\/image\/[^\s\)>]+/g;
      const urls = [...new Set(markdown.match(regex) || [])];

      console.log(`Found ${urls.length} unique images`);

      if (urls.length === 0) {
        console.log('No images found in markdown');
        process.exit(0);
      }

      // Download images
      let downloaded = 0;
      let failed = 0;

      urls.forEach((url, index) => {
        const imageNum = index + 1;
        const filename = `image-${imageNum}.jpg`;
        const filepath = path.join(OUTPUT_DIR, filename);

        process.stdout.write(`[${imageNum.toString().padStart(3)}/${urls.length}] ${filename}... `);

        try {
          execSync(`curl -s -L -m 30 -H "User-Agent: Mozilla/5.0" -o "${filepath}" "${url}"`, {
            timeout: 35000
          });

          // Check if file exists and has content
          if (fs.existsSync(filepath) && fs.statSync(filepath).size > 0) {
            const size = fs.statSync(filepath).size;
            console.log(`✓ (${(size / 1024).toFixed(1)}KB)`);
            downloaded++;
          } else {
            console.log('✗ (empty)');
            failed++;
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
          }
        } catch (error) {
          console.log('✗ (error)');
          failed++;
          if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        }
      });

      console.log('\n============================================================');
      console.log(`Downloaded: ${downloaded}/${urls.length} images`);
      console.log(`Failed: ${failed}`);
      console.log(`Location: ${OUTPUT_DIR}`);
      console.log('============================================================');

    } catch (error) {
      console.error('Error parsing response:', error.message);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
  process.exit(1);
});

req.write(postData);
req.end();
