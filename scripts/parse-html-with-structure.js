const fs = require('fs');
const path = require('path');
const https = require('https');
const { JSDOM } = require('jsdom');

const HTML_FILE = path.join(__dirname, '../content/posts/2023/html.html');
const MDX_FILE = path.join(__dirname, '../content/posts/2023/asia-2023.mdx');
const IMAGE_DIR = path.join(__dirname, '../public/images/asia-2023');

// Read HTML
console.log('Reading HTML file...');
const htmlContent = fs.readFileSync(HTML_FILE, 'utf-8');
const dom = new JSDOM(htmlContent);
const document = dom.window.document;

// Read existing MDX to preserve frontmatter and structure
const mdxContent = fs.readFileSync(MDX_FILE, 'utf-8');

// Find all text blocks and images in order from the article body
const mainContent = document.querySelector('[role="textbox"]');
if (!mainContent) {
  console.error('Could not find main content area');
  process.exit(1);
}

// Get all paragraph-like blocks and images
const blocks = mainContent.querySelectorAll('div[data-block-id]');
console.log(`Found ${blocks.length} content blocks`);

// Build a mapping of text content to images that appear near it
const contentMap = [];
let lastTextBlock = null;
let imagesForCurrentText = [];

blocks.forEach((block) => {
  // Check if block has an image
  const img = block.querySelector('img[src^="/image/"]');

  if (img) {
    const src = img.getAttribute('src');
    const urlPart = src.substring(7);
    const decodedUrl = decodeURIComponent(urlPart.split('?')[0]);
    const fullNotionUrl = `https://lifegorithms.notion.site${src}`;

    // Extract filename
    const urlParts = decodedUrl.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    let filename = lastPart;

    imagesForCurrentText.push({
      url: fullNotionUrl,
      filename: filename,
      path: `/images/asia-2023/${filename}`
    });
  } else {
    // Check if block has meaningful text content
    const textContent = block.textContent?.trim();

    if (textContent && textContent.length > 20) {
      // Save previous text block with its images
      if (lastTextBlock && imagesForCurrentText.length > 0) {
        contentMap.push({
          text: lastTextBlock,
          images: [...imagesForCurrentText]
        });
        imagesForCurrentText = [];
      }

      lastTextBlock = textContent;
    }
  }
});

// Don't forget the last block
if (lastTextBlock && imagesForCurrentText.length > 0) {
  contentMap.push({
    text: lastTextBlock,
    images: [...imagesForCurrentText]
  });
}

console.log(`\nFound ${contentMap.length} text blocks with associated images`);

// Now insert images into MDX after their associated text
let updatedMdx = mdxContent;

// Remove the Photos section we added before
updatedMdx = updatedMdx.replace(/\n## Photos\n\n[\s\S]*$/, '');

// For each text/image mapping, find the text in MDX and add images after it
contentMap.forEach((item, index) => {
  console.log(`\nProcessing block ${index + 1}/${contentMap.length}`);
  console.log(`Text: "${item.text.substring(0, 60)}..."`);
  console.log(`Images: ${item.images.length}`);

  // Try to find this text in the MDX (fuzzy match)
  const searchText = item.text.substring(0, 100);

  // Find approximate location in MDX
  if (updatedMdx.includes(searchText.substring(0, 50))) {
    const imageMarkdown = '\n\n' + item.images.map(img =>
      `![](${img.path})`
    ).join('\n\n') + '\n';

    // Insert images after this text
    const insertPoint = updatedMdx.indexOf(searchText.substring(0, 50)) + searchText.length;
    updatedMdx = updatedMdx.slice(0, insertPoint) + imageMarkdown + updatedMdx.slice(insertPoint);

    console.log(`✓ Inserted ${item.images.length} images`);
  } else {
    console.log(`✗ Could not find matching text in MDX`);
  }
});

// Write updated MDX
fs.writeFileSync(MDX_FILE, updatedMdx);

console.log('\n✅ MDX file updated with images in context!');
console.log(`Updated: ${MDX_FILE}`);
