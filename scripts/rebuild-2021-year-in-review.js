const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');
const path = require('path');
const https = require('https');

// Read the HTML file
const htmlPath = path.join(__dirname, '../content/posts/2023/html.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const dom = new JSDOM(html);
const document = dom.window.document;

// Image directory
const imageDir = path.join(__dirname, '../public/images/2021-year-in-review');
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

// Track image URLs
const imageUrls = new Map();
const contentElements = [];
let imageCounter = 0;
const seenFilenames = new Map();

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Downloaded: ${filepath}`);
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

function collectElements(element, depth = 0) {
  if (!element) return;

  if (element.tagName === 'IMG' && element.getAttribute('src')?.startsWith('/image/')) {
    const src = element.getAttribute('src');
    const urlPart = src.substring(7);
    const decodedUrl = decodeURIComponent(urlPart.split('?')[0]);
    const urlParts = decodedUrl.split('/');
    let filename = urlParts[urlParts.length - 1];

    // Handle duplicate filenames
    if (seenFilenames.has(filename)) {
      const count = seenFilenames.get(filename);
      seenFilenames.set(filename, count + 1);
      const ext = filename.substring(filename.lastIndexOf('.'));
      const base = filename.substring(0, filename.lastIndexOf('.'));
      filename = `${base}_${count}${ext}`;
    } else {
      seenFilenames.set(filename, 1);
    }

    const fullUrl = 'https://www.notion.so' + src;
    imageUrls.set(filename, fullUrl);

    contentElements.push({
      type: 'image',
      path: `/images/2021-year-in-review/${filename}`
    });
    return;
  }

  if (element.tagName === 'H2' || element.tagName === 'H3') {
    const text = element.textContent.trim();
    if (text && !text.match(/^\d{4} - Year in Review$/)) {
      contentElements.push({
        type: element.tagName.toLowerCase(),
        text: text
      });
    }
    return;
  }

  if (element.tagName === 'P') {
    const text = element.textContent.trim();
    if (text && text.length > 0) {
      contentElements.push({
        type: 'p',
        text: text
      });
    }
    return;
  }

  // Recursively process children
  for (const child of element.children) {
    collectElements(child, depth + 1);
  }
}

// Find the main content
const mainContent = document.querySelector('.notion-page-content');
if (mainContent) {
  collectElements(mainContent);
}

async function main() {
  // Download all images
  for (const [filename, url] of imageUrls) {
    const filepath = path.join(imageDir, filename);
    await downloadImage(url, filepath);
  }

  // Generate MDX
  let mdx = `---
title: "2021 - Year in Review"
emoji: "🌎"
date: "2022-01-01"
draft: false
tags: ["article", "life"]
description: "Reflecting on 2021: travels, experiences, and growth"
---

> **Note:** This article was originally published on [Notion](https://lifegorithms.notion.site/2021-Year-in-Review-8f562e2250e04addb00c8f4a8ea7a378).

`;

  let currentImageGroup = [];

  for (let i = 0; i < contentElements.length; i++) {
    const element = contentElements[i];

    if (element.type === 'image') {
      currentImageGroup.push(element.path);

      // Check if next element is also an image
      const nextElement = contentElements[i + 1];
      const isLastElement = i === contentElements.length - 1;

      if (isLastElement || nextElement?.type !== 'image') {
        // Output the image group
        if (currentImageGroup.length === 1) {
          mdx += `\n![](${currentImageGroup[0]})\n`;
        } else {
          const cols = currentImageGroup.length >= 3 ? 3 : 2;
          const imageList = currentImageGroup.map(p => `"${p}"`).join(',');
          mdx += `\n<ImageGrid images={[${imageList}]} cols={${cols}} />\n`;
        }
        currentImageGroup = [];
      }
    } else if (element.type === 'h2') {
      mdx += `\n## ${element.text}\n`;
    } else if (element.type === 'h3') {
      mdx += `\n### ${element.text}\n`;
    } else if (element.type === 'p') {
      mdx += `\n${element.text}\n`;
    }
  }

  const mdxPath = path.join(__dirname, '../content/posts/2022/2021-year-in-review.mdx');
  fs.writeFileSync(mdxPath, mdx);
  console.log(`\nCreated: ${mdxPath}`);
  console.log(`Downloaded ${imageUrls.size} images`);
}

main().catch(console.error);
