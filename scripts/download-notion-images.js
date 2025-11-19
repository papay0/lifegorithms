#!/usr/bin/env node

/**
 * Download all images from Notion articles
 * Usage: node scripts/download-notion-images.js
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Article configurations
const ARTICLES = [
  {
    name: '2023 Year in Review',
    markdownFile: '/tmp/notion-2023-year-review.md',
    outputDir: '/Users/papay0/Dev/lifegorithms/public/images/2023-year-in-review'
  },
  {
    name: 'Asia 2023',
    markdownFile: '/tmp/notion-asia-2023.md',
    outputDir: '/Users/papay0/Dev/lifegorithms/public/images/asia-2023'
  },
  {
    name: '2022 Year in Review',
    markdownFile: '/tmp/notion-2022-year-review.md',
    outputDir: '/Users/papay0/Dev/lifegorithms/public/images/2022-year-in-review'
  },
  {
    name: '2021 Year in Review',
    markdownFile: '/tmp/notion-2021-year-review.md',
    outputDir: '/Users/papay0/Dev/lifegorithms/public/images/2021-year-in-review'
  }
];

/**
 * Extract all Notion image URLs from markdown
 */
function extractImageUrls(markdown) {
  const regex = /https:\/\/lifegorithms\.notion\.site\/image\/[^\s\)>]+/g;
  const matches = markdown.match(regex) || [];
  
  // Deduplicate while preserving order
  const seen = new Set();
  return matches.filter(url => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

/**
 * Download a single image using curl
 */
function downloadImage(url, filepath) {
  try {
    const cmd = `curl -s -L -m 30 -H "User-Agent: Mozilla/5.0" -o "${filepath}" "${url}"`;
    execSync(cmd, { timeout: 35000 });
    
    // Verify file exists and has content
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      return stats.size > 0;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Process a single article
 */
function processArticle(article) {
  console.log('\n' + '='.repeat(70));
  console.log(`Processing: ${article.name}`);
  console.log(`Output: ${article.outputDir}`);
  
  // Check if markdown file exists
  if (!fs.existsSync(article.markdownFile)) {
    console.log(`⚠️  Markdown file not found: ${article.markdownFile}`);
    console.log('Skipping...');
    return 0;
  }
  
  // Read markdown content
  const markdown = fs.readFileSync(article.markdownFile, 'utf8');
  
  // Extract URLs
  const urls = extractImageUrls(markdown);
  console.log(`Found ${urls.length} unique image URLs`);
  
  if (urls.length === 0) {
    console.log('No images to download.');
    return 0;
  }
  
  // Create output directory
  if (!fs.existsSync(article.outputDir)) {
    fs.mkdirSync(article.outputDir, { recursive: true });
  }
  
  // Download images
  let downloaded = 0;
  let failed = 0;
  
  urls.forEach((url, index) => {
    const imageNum = index + 1;
    const filename = `image-${imageNum}.jpg`;
    const filepath = path.join(article.outputDir, filename);
    
    process.stdout.write(`  [${imageNum.toString().padStart(3)}/${urls.length}] ${filename}... `);
    
    if (downloadImage(url, filepath)) {
      console.log('✓');
      downloaded++;
    } else {
      console.log('✗');
      failed++;
    }
  });
  
  console.log(`\n${article.name}: ${downloaded}/${urls.length} downloaded (${failed} failed)`);
  return downloaded;
}

/**
 * Main function
 */
function main() {
  console.log('='.repeat(70));
  console.log('        Notion Images Downloader - ALL ARTICLES');
  console.log('='.repeat(70));
  console.log('\nThis script will download all images from 4 Notion articles.');
  console.log('Make sure the markdown files are available in /tmp/');
  
  let totalDownloaded = 0;
  
  for (const article of ARTICLES) {
    const count = processArticle(article);
    totalDownloaded += count;
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`TOTAL IMAGES DOWNLOADED: ${totalDownloaded}`);
  console.log('='.repeat(70) + '\n');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { extractImageUrls, downloadImage, processArticle };
