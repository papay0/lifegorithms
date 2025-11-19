const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML_FILE = path.join(__dirname, '../content/posts/2023/html.html');
const MDX_FILE = path.join(__dirname, '../content/posts/2023/asia-2023-full.mdx');

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

// Get ALL blocks and walk through them recursively
function processElement(element, depth = 0) {
  if (!element) return;

  // Check if this element itself has an image
  if (element.tagName === 'IMG' && element.getAttribute('src')?.startsWith('/image/')) {
    const src = element.getAttribute('src');
    const urlPart = src.substring(7);
    const decodedUrl = decodeURIComponent(urlPart.split('?')[0]);
    const urlParts = decodedUrl.split('/');
    const filename = urlParts[urlParts.length - 1];

    mdxOutput += `\n![](/images/asia-2023/${filename})\n`;
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
        processElement(child, depth + 1);
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
        mdxOutput += `\n## ${text}\n`;
      } else if (classList.includes('notion-heading_2') ||
                 classList.includes('notion-heading_3') ||
                 text.match(/^(Arriving|Exploring|Reflecting|Bangkok|Chiang Mai|Taipei|Kyoto|Tokyo|More)/i)) {
        mdxOutput += `\n### ${text}\n`;
      } else {
        mdxOutput += `\n## ${text}\n`;
      }
    }
    // List items
    else if (classList.includes('notion-bulleted_list')) {
      const cleanText = text.replace(/^[•·-]\s+/, '');
      mdxOutput += `- ${cleanText}\n`;
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
          // Only replace if the link text appears in the processed text
          if (processedText.includes(linkText)) {
            processedText = processedText.replace(linkText, `[${linkText}](${href})`);
          }
        }
      });

      mdxOutput += `\n${processedText}\n`;
    }

    // Now process images in this block
    imgs.forEach(img => {
      const src = img.getAttribute('src');
      const urlPart = src.substring(7);
      const decodedUrl = decodeURIComponent(urlPart.split('?')[0]);
      const urlParts = decodedUrl.split('/');
      const filename = urlParts[urlParts.length - 1];

      mdxOutput += `\n![](/images/asia-2023/${filename})\n`;
    });

    return; // Don't process children if we processed the block
  }

  // Otherwise, process children
  if (element.children) {
    for (let child of element.children) {
      processElement(child, depth + 1);
    }
  }
}

console.log('Processing content...');
processElement(mainContent);

// Write the output
fs.writeFileSync(MDX_FILE, mdxOutput);

const imageCount = (mdxOutput.match(/!\[\]/g) || []).length;

console.log(`\n✅ Full article created!`);
console.log(`Output: ${MDX_FILE}`);
console.log(`Total length: ${mdxOutput.length} characters`);
console.log(`Images: ${imageCount}`);
