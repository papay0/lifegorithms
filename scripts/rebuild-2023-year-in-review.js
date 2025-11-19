const fs = require('fs');
const path = require('path');
const https = require('https');
const { JSDOM } = require('jsdom');

const HTML_FILE = path.join(__dirname, '../content/posts/2023/html.html');
const MDX_FILE = path.join(__dirname, '../content/posts/2024/2023-year-in-review.mdx');
const IMAGE_DIR = path.join(__dirname, '../public/images/2023-year-in-review');

// Create image directory if it doesn't exist
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

console.log('Reading HTML file...');
const htmlContent = fs.readFileSync(HTML_FILE, 'utf-8');
const dom = new JSDOM(htmlContent);
const document = dom.window.document;

const mainContent = document.querySelector('[role="textbox"]');
if (!mainContent) {
  console.error('Could not find main content');
  process.exit(1);
}

let mdxOutput = `---
title: "2023 - Year in Review 🌎"
emoji: "🌎"
date: "2023-12-31"
draft: false
tags: ["article", "life"]
description: "Reflecting on 2023: travels, growth, and learnings"
---

> **Note:** This article was originally published on [Notion](https://lifegorithms.notion.site/2023-Year-in-Review-23b9e995628b41aba69c09179f1a8334).

`;

// Collect all content elements
const contentElements = [];
const imageUrls = new Map(); // filename -> full URL

function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(IMAGE_DIR, filename);

    // Skip if already exists
    if (fs.existsSync(filepath)) {
      console.log(`  ✓ ${filename} (cached)`);
      resolve();
      return;
    }

    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://www.notion.so/'
      },
      followRedirect: true
    }, (res) => {
      // Follow redirects
      if (res.statusCode === 302 || res.statusCode === 301) {
        https.get(res.headers.location, (redirectRes) => {
          const fileStream = fs.createWriteStream(filepath);
          redirectRes.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close();
            console.log(`  ✓ ${filename}`);
            resolve();
          });
        }).on('error', reject);
      } else {
        const fileStream = fs.createWriteStream(filepath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`  ✓ ${filename}`);
          resolve();
        });
      }
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
    const filename = urlParts[urlParts.length - 1];

    // Store the full URL for downloading
    const fullUrl = 'https://www.notion.so' + src;
    imageUrls.set(filename, fullUrl);

    contentElements.push({
      type: 'image',
      path: `/images/2023-year-in-review/${filename}`
    });
    return;
  }

  const blockId = element.getAttribute('data-block-id');
  if (blockId) {
    const text = element.textContent?.trim();

    if (!text || text.length === 0 ||
        text.match(/^(Open in Notion|Don't have|Skip to content|Get Notion|Lifegorithms)/)) {
      for (let child of element.children || []) {
        collectElements(child, depth + 1);
      }
      return;
    }

    // Skip title (already in frontmatter)
    if (text.includes('2023 - Year in Review') || text === '2023 - Year in Review') {
      return;
    }

    const imgs = element.querySelectorAll('img[src^="/image/"]');
    const hasImages = imgs.length > 0;
    const classList = element.className || '';

    // Check if it's a heading
    if (classList.includes('notion-heading') ||
        text.match(/^(January|February|March|April|May|June|July|August|September|October|November|December|Reflecting|Whooo what|Summary)/i)) {

      // Determine heading level
      if (classList.includes('notion-heading_1') ||
          text.match(/^(January|February|March|April|May|June|July|August|September|October|November|December|Reflection)$/)) {
        contentElements.push({ type: 'heading2', text });
      } else if (classList.includes('notion-heading_2') ||
                 classList.includes('notion-heading_3')) {
        contentElements.push({ type: 'heading3', text });
      } else {
        contentElements.push({ type: 'heading2', text });
      }
    }
    // List items
    else if (classList.includes('notion-bulleted_list')) {
      const cleanText = text.replace(/^[•·-]\s+/, '');
      contentElements.push({ type: 'list', text: cleanText });
    }
    // Regular paragraph
    else if (text.length > 0 && !hasImages) {
      const links = element.querySelectorAll('a[href]');
      let processedText = text;

      links.forEach(link => {
        const href = link.getAttribute('href');
        const linkText = link.textContent?.trim();
        if (href && linkText && href.startsWith('http') && !href.includes('notion.site')) {
          if (processedText.includes(linkText)) {
            processedText = processedText.replace(linkText, `[${linkText}](${href})`);
          }
        }
      });

      contentElements.push({ type: 'paragraph', text: processedText });
    }

    // Collect images in this block
    imgs.forEach(img => {
      const src = img.getAttribute('src');
      const urlPart = src.substring(7);
      const decodedUrl = decodeURIComponent(urlPart.split('?')[0]);
      const urlParts = decodedUrl.split('/');
      const filename = urlParts[urlParts.length - 1];

      // Store the full URL for downloading
      const fullUrl = 'https://www.notion.so' + src;
      imageUrls.set(filename, fullUrl);

      contentElements.push({
        type: 'image',
        path: `/images/2023-year-in-review/${filename}`
      });
    });

    return;
  }

  if (element.children) {
    for (let child of element.children) {
      collectElements(child, depth + 1);
    }
  }
}

console.log('Collecting content...');
collectElements(mainContent);

console.log(`\nFound ${imageUrls.size} unique images`);
console.log('Downloading images...');

// Download all images
async function downloadAllImages() {
  let downloaded = 0;
  for (const [filename, url] of imageUrls) {
    try {
      await downloadImage(url, filename);
      downloaded++;
    } catch (err) {
      console.error(`  ✗ ${filename}: ${err.message}`);
    }
  }
  console.log(`\nDownloaded ${downloaded}/${imageUrls.size} images`);
}

downloadAllImages().then(() => {
  // Process elements and group consecutive images into grids
  console.log('\nCreating grids from consecutive images...');
  let i = 0;
  while (i < contentElements.length) {
    const elem = contentElements[i];

    if (elem.type === 'heading2') {
      mdxOutput += `\n## ${elem.text}\n`;
      i++;
    } else if (elem.type === 'heading3') {
      mdxOutput += `\n### ${elem.text}\n`;
      i++;
    } else if (elem.type === 'list') {
      mdxOutput += `- ${elem.text}\n`;
      i++;
    } else if (elem.type === 'paragraph') {
      mdxOutput += `\n${elem.text}\n`;
      i++;
    } else if (elem.type === 'image') {
      // Look ahead to count consecutive images
      let consecutiveImages = [];
      let j = i;
      while (j < contentElements.length && contentElements[j].type === 'image') {
        consecutiveImages.push(contentElements[j].path);
        j++;
      }

      // If we have 2-4 consecutive images, create a 2-column grid
      if (consecutiveImages.length >= 2 && consecutiveImages.length <= 4) {
        mdxOutput += `\n<ImageGrid images={${JSON.stringify(consecutiveImages)}} cols={2} />\n`;
        i = j;
      }
      // If more than 4, create a 3-column grid
      else if (consecutiveImages.length > 4) {
        mdxOutput += `\n<ImageGrid images={${JSON.stringify(consecutiveImages)}} cols={3} />\n`;
        i = j;
      }
      // Single image
      else {
        mdxOutput += `\n![](${elem.path})\n`;
        i++;
      }
    } else {
      i++;
    }
  }

  // Write the output
  fs.writeFileSync(MDX_FILE, mdxOutput);

  const imageCount = (mdxOutput.match(/!\[\]|<ImageGrid/g) || []).length;
  const gridCount = (mdxOutput.match(/<ImageGrid/g) || []).length;

  console.log(`\n✅ Full article created with ImageGrid components!`);
  console.log(`Output: ${MDX_FILE}`);
  console.log(`Total length: ${mdxOutput.length} characters`);
  console.log(`Images/Grids: ${imageCount}`);
  console.log(`Grids: ${gridCount}`);
});
