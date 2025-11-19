const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML_FILE = path.join(__dirname, '../content/posts/2023/html.html');
const MDX_FILE = path.join(__dirname, '../content/posts/2023/asia-2023.mdx');

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
title: "Asia 2023 (Singapore, Thailand, South Korea, Taiwan & Japan) 🌏"
emoji: "🌏"
date: "2023-10-15"
draft: false
tags: ["article", "travel"]
description: "30-day journey across 5 Asian countries"
---

> **Note:** This article was originally published on [Notion](https://lifegorithms.notion.site/Asia-2023-Singapore-Thailand-South-Korea-Taiwan-Japan-4c0a3b03b39b4396ad636f9dd961d771).

`;

// Collect all content elements
const contentElements = [];

function collectElements(element, depth = 0) {
  if (!element) return;

  if (element.tagName === 'IMG' && element.getAttribute('src')?.startsWith('/image/')) {
    const src = element.getAttribute('src');
    const urlPart = src.substring(7);
    const decodedUrl = decodeURIComponent(urlPart.split('?')[0]);
    const urlParts = decodedUrl.split('/');
    const filename = urlParts[urlParts.length - 1];

    contentElements.push({
      type: 'image',
      path: `/images/asia-2023/${filename}`
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

    if (text.includes('Asia 2023') && text.includes('Singapore') && text.includes('Japan')) {
      return;
    }

    const imgs = element.querySelectorAll('img[src^="/image/"]');
    const hasImages = imgs.length > 0;
    const classList = element.className || '';

    if (classList.includes('notion-heading') ||
        text.match(/^(Day \d+|Itinerary|Reflecting|Whooo what)/i)) {

      if (classList.includes('notion-heading_1') ||
          text.match(/^(Itinerary|Singapore|Thailand|South Korea|Taiwan|Japan|Reflection)$/)) {
        contentElements.push({ type: 'heading2', text });
      } else if (classList.includes('notion-heading_2') ||
                 classList.includes('notion-heading_3') ||
                 text.match(/^(Arriving|Exploring|Reflecting|Bangkok|Chiang Mai|Taipei|Kyoto|Tokyo|More)/i)) {
        contentElements.push({ type: 'heading3', text });
      } else {
        contentElements.push({ type: 'heading2', text });
      }
    }
    else if (classList.includes('notion-bulleted_list')) {
      const cleanText = text.replace(/^[•·-]\s+/, '');
      contentElements.push({ type: 'list', text: cleanText });
    }
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

    imgs.forEach(img => {
      const src = img.getAttribute('src');
      const urlPart = src.substring(7);
      const decodedUrl = decodeURIComponent(urlPart.split('?')[0]);
      const urlParts = decodedUrl.split('/');
      const filename = urlParts[urlParts.length - 1];

      contentElements.push({
        type: 'image',
        path: `/images/asia-2023/${filename}`
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

// Process elements and group consecutive images into grids
console.log('Creating grids from consecutive images...');
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
