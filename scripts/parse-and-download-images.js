const fs = require('fs');
const path = require('path');
const https = require('https');
const { JSDOM } = require('jsdom');

const HTML_FILE = path.join(__dirname, '../content/posts/2023/html.html');
const MDX_FILE = path.join(__dirname, '../content/posts/2023/asia-2023.mdx');
const IMAGE_DIR = path.join(__dirname, '../public/images/asia-2023');

// Create image directory if it doesn't exist
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

// Read and parse HTML
console.log('Reading HTML file...');
const htmlContent = fs.readFileSync(HTML_FILE, 'utf-8');
const dom = new JSDOM(htmlContent);
const document = dom.window.document;

// Find all images
const images = document.querySelectorAll('img');
console.log(`Found ${images.length} images`);

const imageUrls = [];
images.forEach((img, index) => {
  let src = img.getAttribute('src');
  if (src) {
    // Notion images are in format /image/https%3A%2F%2F...
    if (src.startsWith('/image/')) {
      // For Notion images, we need to construct the full URL with query params
      // Format: https://lifegorithms.notion.site/image/[encoded_url]?[params]
      const fullNotionUrl = `https://lifegorithms.notion.site${src}`;

      // Extract filename from the encoded URL for saving
      const urlPart = src.substring(7); // Remove '/image/'
      const decodedUrl = decodeURIComponent(urlPart.split('?')[0]);

      if (decodedUrl.startsWith('http')) {
        imageUrls.push({
          url: fullNotionUrl, // Use full Notion proxy URL
          sourceUrl: decodedUrl, // Keep track of original URL for naming
          index: index,
          alt: img.getAttribute('alt') || `Image ${index + 1}`
        });
      }
    } else if (src.startsWith('http')) {
      imageUrls.push({
        url: src,
        sourceUrl: src,
        index: index,
        alt: img.getAttribute('alt') || `Image ${index + 1}`
      });
    }
  }
});

console.log(`Found ${imageUrls.length} valid image URLs`);

// Download images with redirect support
const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');

    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
        fileStream.on('error', (err) => {
          fs.unlink(filepath, () => {});
          reject(err);
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        const redirectUrl = response.headers.location;
        resolve(downloadImage(redirectUrl, filepath));
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
};

// Download all images
(async () => {
  const downloadedImages = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const imageData = imageUrls[i];
    const url = imageData.url;
    const sourceUrl = imageData.sourceUrl || url;

    // Generate filename from source URL or use index
    let filename = `image-${i + 1}.jpg`;

    // Try to extract meaningful filename from source URL
    const urlParts = sourceUrl.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart && lastPart.includes('.')) {
      const cleanName = lastPart.split('?')[0];
      if (cleanName.length < 100) {
        filename = cleanName;
      }
    }

    const filepath = path.join(IMAGE_DIR, filename);

    console.log(`Downloading ${i + 1}/${imageUrls.length}: ${filename}`);

    try {
      await downloadImage(url, filepath);
      downloadedImages.push({
        filename: filename,
        relativePath: `/images/asia-2023/${filename}`,
        alt: imageData.alt
      });
    } catch (error) {
      console.error(`Failed to download ${url}:`, error.message);
    }
  }

  console.log(`\nDownloaded ${downloadedImages.length} images`);

  // Read existing MDX file
  let mdxContent = fs.readFileSync(MDX_FILE, 'utf-8');

  // Add images section at the end
  const imagesSection = `\n\n## Photos\n\n${downloadedImages.map((img, idx) =>
    `![${img.alt}](${img.relativePath})\n`
  ).join('\n')}`;

  mdxContent += imagesSection;

  // Write updated MDX file
  fs.writeFileSync(MDX_FILE, mdxContent);

  console.log('\nUpdated MDX file with images!');
  console.log('Summary:');
  console.log(`- Downloaded: ${downloadedImages.length} images`);
  console.log(`- Location: ${IMAGE_DIR}`);
  console.log(`- Updated: ${MDX_FILE}`);

})();
