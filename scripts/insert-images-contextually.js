const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const HTML_FILE = path.join(__dirname, '../content/posts/2023/html.html');
const MDX_FILE = path.join(__dirname, '../content/posts/2023/asia-2023.mdx');

console.log('Reading files...');
const htmlContent = fs.readFileSync(HTML_FILE, 'utf-8');
const mdxContent = fs.readFileSync(MDX_FILE, 'utf-8');

const dom = new JSDOM(htmlContent);
const document = dom.window.document;

// Find all text and image blocks in order
const allBlocks = [];

// Get the main content area
const mainContent = document.querySelector('.notion-page-content, [role="textbox"], .layout');
if (!mainContent) {
  console.error('Could not find main content');
  process.exit(1);
}

// Walk through all elements and extract text/images in order
function walkElements(element, depth = 0) {
  if (!element || !element.children) return;

  for (let child of element.children) {
    // Check for images
    const img = child.querySelector('img[src^="/image/"]');
    if (img) {
      const src = img.getAttribute('src');
      const urlPart = src.substring(7);
      const decodedUrl = decodeURIComponent(urlPart.split('?')[0]);

      // Extract filename
      const urlParts = decodedUrl.split('/');
      const filename = urlParts[urlParts.length - 1];

      allBlocks.push({
        type: 'image',
        filename: filename,
        path: `/images/asia-2023/${filename}`
      });
    }

    // Check for heading text
    const headingMatch = child.textContent?.match(/^(Day \d+|Itinerary|Singapore|Thailand|Bangkok|Chiang Mai|South Korea|Seoul|Taiwan|Taipei|Japan|Kyoto|Tokyo|Reflection|Whooo what a day!)/);
    if (headingMatch && child.textContent.trim().length < 200) {
      const text = child.textContent.trim();
      if (text.length > 0 && !text.match(/^(Open in Notion|Don't have)/)) {
        allBlocks.push({
          type: 'heading',
          text: text
        });
      }
    }

    walkElements(child, depth + 1);
  }
}

walkElements(mainContent);

console.log(`Found ${allBlocks.length} blocks (text + images)`);

// Group images by the heading they appear under
const sections = [];
let currentSection = null;

allBlocks.forEach(block => {
  if (block.type === 'heading') {
    if (currentSection) {
      sections.push(currentSection);
    }
    currentSection = {
      heading: block.text,
      images: []
    };
  } else if (block.type === 'image' && currentSection) {
    currentSection.images.push(block);
  }
});

if (currentSection) {
  sections.push(currentSection);
}

console.log(`\nGrouped into ${sections.length} sections:`);
sections.forEach(section => {
  console.log(`- "${section.heading}": ${section.images.length} images`);
});

// Now insert images into MDX
let updatedMdx = mdxContent;

// Remove the Photos section at the end
updatedMdx = updatedMdx.replace(/\n## Photos\n\n[\s\S]*$/, '');

// For each section, find it in MDX and add images
sections.forEach(section => {
  if (section.images.length === 0) return;

  // Find this heading in the MDX
  const headingVariations = [
    section.heading,
    section.heading.replace(/\s+\([^)]+\)/, ''), // Remove parentheses
    section.heading.substring(0, 30), // First 30 chars
  ];

  let found = false;
  for (let variation of headingVariations) {
    if (updatedMdx.includes(variation)) {
      // Find the end of this section (next ## heading or end of file)
      const headingPos = updatedMdx.indexOf(variation);
      const nextHeadingPos = updatedMdx.indexOf('\n## ', headingPos + 1);
      const insertPos = nextHeadingPos > 0 ? nextHeadingPos : updatedMdx.length;

      // Create image markdown
      const imageMarkdown = '\n\n' + section.images.map(img =>
        `![](${img.path})`
      ).join('\n\n');

      // Insert images before the next section
      updatedMdx = updatedMdx.slice(0, insertPos) + imageMarkdown + '\n' + updatedMdx.slice(insertPos);

      console.log(`✓ Inserted ${section.images.length} images into "${section.heading}"`);
      found = true;
      break;
    }
  }

  if (!found) {
    console.log(`✗ Could not find section: "${section.heading}"`);
  }
});

// Write updated MDX
fs.writeFileSync(MDX_FILE, updatedMdx);

console.log('\n✅ Images inserted contextually!');
