const fs = require('fs');
const path = require('path');
const https = require('https');
const { JSDOM } = require('jsdom');

const HTML_FILE = path.join(__dirname, '../content/posts/2023/html.html');
const MDX_FILE = path.join(__dirname, '../content/posts/2023/my-life-learnings-values.mdx');
const IMAGE_DIR = path.join(__dirname, '../public/images/life-learnings');

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
title: "My life learnings & values"
emoji: "💡"
date: "2023-02-26"
draft: false
tags: ["article", "life"]
description: "Personal reflections on values, goals, and life principles"
---

> **Note:** This article was originally published on [Notion](https://lifegorithms.notion.site/My-life-learnings-values-Feb-26-2023-c7fe1793a2fc431ba536dad26cf24d66).

`;

// Collect all content elements
const contentElements = [];
const imageUrls = new Map();

function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(IMAGE_DIR, filename);

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

    const fullUrl = 'https://www.notion.so' + src;
    imageUrls.set(filename, fullUrl);

    contentElements.push({
      type: 'image',
      path: `/images/life-learnings/${filename}`
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

    // Skip title
    if (text.includes('My life learnings') && text.includes('values')) {
      return;
    }

    const imgs = element.querySelectorAll('img[src^="/image/"]');
    const hasImages = imgs.length > 0;
    const classList = element.className || '';

    // Headings
    if (classList.includes('notion-heading')) {
      if (classList.includes('notion-heading_1')) {
        contentElements.push({ type: 'heading2', text });
      } else if (classList.includes('notion-heading_2') || classList.includes('notion-heading_3')) {
        contentElements.push({ type: 'heading3', text });
      } else {
        contentElements.push({ type: 'heading2', text });
      }
    }
    // List items
    else if (classList.includes('notion-bulleted_list') || classList.includes('notion-numbered_list')) {
      const cleanText = text.replace(/^[•·-]\s+/, '').replace(/^\d+\.\s+/, '');
      const isNumbered = classList.includes('notion-numbered_list');
      contentElements.push({ type: isNumbered ? 'numbered-list' : 'list', text: cleanText });
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

    // Collect images
    imgs.forEach(img => {
      const src = img.getAttribute('src');
      const urlPart = src.substring(7);
      const decodedUrl = decodeURIComponent(urlPart.split('?')[0]);
      const urlParts = decodedUrl.split('/');
      const filename = urlParts[urlParts.length - 1];

      const fullUrl = 'https://www.notion.so' + src;
      imageUrls.set(filename, fullUrl);

      contentElements.push({
        type: 'image',
        path: `/images/life-learnings/${filename}`
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

if (imageUrls.size > 0) {
  console.log('Downloading images...');
}

async function downloadAllImages() {
  if (imageUrls.size === 0) {
    console.log('No images to download');
    return;
  }

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
  console.log('\nGenerating MDX...');
  let i = 0;
  let lastWasList = false;
  let lastWasNumberedList = false;

  while (i < contentElements.length) {
    const elem = contentElements[i];

    if (elem.type === 'heading2') {
      mdxOutput += `\n## ${elem.text}\n`;
      lastWasList = false;
      lastWasNumberedList = false;
      i++;
    } else if (elem.type === 'heading3') {
      mdxOutput += `\n### ${elem.text}\n`;
      lastWasList = false;
      lastWasNumberedList = false;
      i++;
    } else if (elem.type === 'list') {
      if (!lastWasList) mdxOutput += '\n';
      mdxOutput += `- ${elem.text}\n`;
      lastWasList = true;
      lastWasNumberedList = false;
      i++;
    } else if (elem.type === 'numbered-list') {
      if (!lastWasNumberedList) mdxOutput += '\n';
      mdxOutput += `1. ${elem.text}\n`;
      lastWasList = false;
      lastWasNumberedList = true;
      i++;
    } else if (elem.type === 'paragraph') {
      mdxOutput += `\n${elem.text}\n`;
      lastWasList = false;
      lastWasNumberedList = false;
      i++;
    } else if (elem.type === 'image') {
      // Look ahead for consecutive images
      let consecutiveImages = [];
      let j = i;
      while (j < contentElements.length && contentElements[j].type === 'image') {
        consecutiveImages.push(contentElements[j].path);
        j++;
      }

      if (consecutiveImages.length >= 2 && consecutiveImages.length <= 4) {
        mdxOutput += `\n<ImageGrid images={${JSON.stringify(consecutiveImages)}} cols={2} />\n`;
        i = j;
      } else if (consecutiveImages.length > 4) {
        mdxOutput += `\n<ImageGrid images={${JSON.stringify(consecutiveImages)}} cols={3} />\n`;
        i = j;
      } else {
        mdxOutput += `\n![](${elem.path})\n`;
        i++;
      }
      lastWasList = false;
      lastWasNumberedList = false;
    } else {
      i++;
    }
  }

  fs.writeFileSync(MDX_FILE, mdxOutput);

  const imageCount = (mdxOutput.match(/!\[\]|<ImageGrid/g) || []).length;
  const gridCount = (mdxOutput.match(/<ImageGrid/g) || []).length;

  console.log(`\n✅ Article created!`);
  console.log(`Output: ${MDX_FILE}`);
  console.log(`Total length: ${mdxOutput.length} characters`);
  console.log(`Images/Grids: ${imageCount}`);
  console.log(`Grids: ${gridCount}`);
});
