const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML_FILE = path.join(__dirname, '../content/posts/2023/html.html');
const MDX_FILE = path.join(__dirname, '../content/posts/2023/asia-2023.mdx');

console.log('Reading HTML file...');
const htmlContent = fs.readFileSync(HTML_FILE, 'utf-8');
const dom = new JSDOM(htmlContent);
const document = dom.window.document;

// Find the main content
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

`;

// Collect all content elements with their types
const contentElements = [];

function collectElements(element, depth = 0) {
  if (!element) return;

  // Check if this element itself has an image
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

  // Check if element has data-block-id (Notion blocks)
  const blockId = element.getAttribute('data-block-id');
  if (blockId) {
    const text = element.textContent?.trim();

    // Skip empty or UI elements
    if (!text || text.length === 0 ||
        text.match(/^(Open in Notion|Don't have|Skip to content|Get Notion|Lifegorithms)/)) {
      // Still process children for images
      for (let child of element.children || []) {
        collectElements(child, depth + 1);
      }
      return;
    }

    // Skip title (already in frontmatter)
    if (text.includes('Asia 2023') && text.includes('Singapore') && text.includes('Japan')) {
      return;
    }

    // Check for images in this block first
    const imgs = element.querySelectorAll('img[src^="/image/"]');
    const hasImages = imgs.length > 0;

    // Detect block type
    const classList = element.className || '';

    // Check if it's a heading
    if (classList.includes('notion-heading') ||
        text.match(/^(Day \d+|Itinerary|Reflecting|Whooo what)/i)) {

      // Determine heading level
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
    // List items
    else if (classList.includes('notion-bulleted_list')) {
      const cleanText = text.replace(/^[•·-]\s+/, '');
      contentElements.push({ type: 'list', text: cleanText });
    }
    // Regular paragraph
    else if (text.length > 0 && !hasImages) {
      // Extract links
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

    // Now collect images in this block
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

  // Otherwise, process children
  if (element.children) {
    for (let child of element.children) {
      collectElements(child, depth + 1);
    }
  }
}

console.log('Collecting content...');
collectElements(mainContent);

// Now process elements and group consecutive images into grids
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

    // If we have 2-4 consecutive images, create a grid
    if (consecutiveImages.length >= 2 && consecutiveImages.length <= 4) {
      mdxOutput += `\n<div className="grid grid-cols-2 gap-4 my-8">\n`;
      consecutiveImages.forEach(imgPath => {
        mdxOutput += `  ![](${imgPath})\n`;
      });
      mdxOutput += `</div>\n`;
      i = j; // Skip all the images we just processed
    }
    // If more than 4, create a 3-column grid
    else if (consecutiveImages.length > 4) {
      mdxOutput += `\n<div className="grid grid-cols-2 md:grid-cols-3 gap-4 my-8">\n`;
      consecutiveImages.forEach(imgPath => {
        mdxOutput += `  ![](${imgPath})\n`;
      });
      mdxOutput += `</div>\n`;
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

const imageCount = (mdxOutput.match(/!\[\]/g) || []).length;
const gridCount = (mdxOutput.match(/<div className="grid/g) || []).length;

console.log(`\n✅ Full article created with image grids!`);
console.log(`Output: ${MDX_FILE}`);
console.log(`Total length: ${mdxOutput.length} characters`);
console.log(`Images: ${imageCount}`);
console.log(`Grids: ${gridCount}`);
