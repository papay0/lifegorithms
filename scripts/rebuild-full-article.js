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

// Process all blocks in order
const blocks = mainContent.querySelectorAll('[data-block-id]');
console.log(`Processing ${blocks.length} blocks...`);

let inList = false;
let listItems = [];

blocks.forEach((block, index) => {
  // Skip if no meaningful content
  const text = block.textContent?.trim();
  if (!text || text.length === 0) return;

  // Skip navigation/UI elements
  if (text.match(/^(Open in Notion|Don't have|Skip to content|Get Notion|Lifegorithms)/)) {
    return;
  }

  // Check for images
  const img = block.querySelector('img[src^="/image/"]');
  if (img) {
    const src = img.getAttribute('src');
    const urlPart = src.substring(7);
    const decodedUrl = decodeURIComponent(urlPart.split('?')[0]);
    const urlParts = decodedUrl.split('/');
    const filename = urlParts[urlParts.length - 1];

    mdxOutput += `\n![](/images/asia-2023/${filename})\n`;
    return;
  }

  // Detect heading levels based on text patterns and styling
  const classList = block.className || '';

  // Main title (skip, already in frontmatter)
  if (text.includes('Asia 2023') && text.includes('Singapore') && text.includes('Japan')) {
    return;
  }

  // Day headings (## headings)
  if (text.match(/^Day \d+/i) || text.match(/^(Itinerary|Singapore|Thailand|Bangkok|Chiang Mai|South Korea|Seoul|Taiwan|Taipei|Japan|Kyoto|Tokyo|Reflection)$/)) {
    if (inList) {
      inList = false;
    }

    // Check if it's a sub-heading (###)
    if (text.match(/^(Arriving|Exploring|Reflecting|More)/i) ||
        text.match(/^(Bangkok|Chiang Mai|Taipei)$/) ||
        classList.includes('notion-heading_3')) {
      mdxOutput += `\n### ${text}\n`;
    } else {
      mdxOutput += `\n## ${text}\n`;
    }
    return;
  }

  // Bullet points
  if (classList.includes('notion-bulleted_list') || text.match(/^[•·-]\s/)) {
    const cleanText = text.replace(/^[•·-]\s+/, '');
    mdxOutput += `- ${cleanText}\n`;
    inList = true;
    return;
  }

  // Check if this is a link-heavy paragraph (extract links)
  const links = block.querySelectorAll('a[href]');
  let processedText = text;

  links.forEach(link => {
    const href = link.getAttribute('href');
    const linkText = link.textContent;
    if (href && href.startsWith('http') && !href.includes('notion.site')) {
      processedText = processedText.replace(linkText, `[${linkText}](${href})`);
    }
  });

  // Regular paragraph
  if (processedText.length > 0) {
    if (inList) {
      mdxOutput += '\n';
      inList = false;
    }
    mdxOutput += `\n${processedText}\n`;
  }
});

// Write the output
fs.writeFileSync(MDX_FILE, mdxOutput);

console.log(`\n✅ Full article created!`);
console.log(`Output: ${MDX_FILE}`);
console.log(`Total length: ${mdxOutput.length} characters`);
