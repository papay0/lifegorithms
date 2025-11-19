const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Article configurations
const articles = [
  {
    url: 'https://lifegorithms.notion.site/2023-Year-in-Review-23b9e995628b41aba69c09179f1a8334',
    folder: '2023-year-in-review',
    mdxPath: 'content/posts/2023/2023-year-in-review.mdx'
  },
  {
    url: 'https://lifegorithms.notion.site/Asia-2023-Singapore-Thailand-South-Korea-Taiwan-Japan-4c0a3b03b39b4396ad636f9dd961d771',
    folder: 'asia-2023',
    mdxPath: 'content/posts/2023/asia-2023.mdx'
  },
  {
    url: 'https://lifegorithms.notion.site/2022-Year-in-Review-369ea5104bde46b9abdd53e386348c06',
    folder: '2022-year-in-review',
    mdxPath: 'content/posts/2022/2022-year-in-review.mdx'
  },
  {
    url: 'https://lifegorithms.notion.site/2021-Year-in-Review-8f562e2250e04addb00c8f4a8ea7a378',
    folder: '2021-year-in-review',
    mdxPath: 'content/posts/2021/2021-year-in-review.mdx'
  }
];

// Download image from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };

    const file = fs.createWriteStream(filepath);

    protocol.get(url, options, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(filepath);
        return downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded: ${path.basename(filepath)}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Fetch markdown from Firecrawl API
async function fetchMarkdown(url) {
  return new Promise((resolve, reject) => {
    const apiUrl = 'https://api.firecrawl.dev/v1/scrape';
    const postData = JSON.stringify({
      url: url,
      formats: ['markdown']
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY || 'fc-46c0631ee9d64cd3b71ea32c21f56e95'}`
      }
    };

    const req = https.request(apiUrl, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.data && result.data.markdown) {
            resolve(result.data.markdown);
          } else if (result.markdown) {
            resolve(result.markdown);
          } else {
            console.log('API Response:', JSON.stringify(result, null, 2).substring(0, 500));
            resolve('');
          }
        } catch (e) {
          console.error('Parse error:', e);
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Extract image URLs from markdown
function extractImageUrls(markdown) {
  const imageRegex = /!\[.*?\]\((https:\/\/lifegorithms\.notion\.site\/image\/[^)]+)\)/g;
  const urls = [];
  let match;

  while ((match = imageRegex.exec(markdown)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}

// Process a single article
async function processArticle(article) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing: ${article.folder}`);
  console.log(`${'='.repeat(60)}`);

  try {
    // Create output directory
    const outputDir = path.join('/Users/papay0/Dev/lifegorithms/public/images', article.folder);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('Fetching markdown...');
    const markdown = await fetchMarkdown(article.url);

    console.log('Extracting image URLs...');
    const imageUrls = extractImageUrls(markdown);
    console.log(`Found ${imageUrls.length} images`);

    if (imageUrls.length === 0) {
      console.log('No images to download');
      return;
    }

    // Download images in batches of 5 to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < imageUrls.length; i += batchSize) {
      const batch = imageUrls.slice(i, i + batchSize);
      console.log(`\nDownloading batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(imageUrls.length / batchSize)}...`);

      await Promise.all(batch.map((url, idx) => {
        const imageNum = i + idx + 1;
        const filename = `image-${imageNum}.jpg`;
        const filepath = path.join(outputDir, filename);

        return downloadImage(url, filepath).catch(err => {
          console.error(`✗ Failed to download image ${imageNum}: ${err.message}`);
        });
      }));

      // Small delay between batches
      if (i + batchSize < imageUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update markdown to use local paths
    let updatedMarkdown = markdown;
    imageUrls.forEach((url, i) => {
      const localPath = `/images/${article.folder}/image-${i + 1}.jpg`;
      updatedMarkdown = updatedMarkdown.replace(url, localPath);
    });

    // Remove base64 images and "Go online to view this image" text
    updatedMarkdown = updatedMarkdown.replace(/!\[.*?\]\(<Base64-Image-Removed>\)/g, '');
    updatedMarkdown = updatedMarkdown.replace(/Go online to view this image\n\n/g, '');

    // Save updated markdown
    const mdxFullPath = path.join('/Users/papay0/Dev/lifegorithms', article.mdxPath);
    const mdxDir = path.dirname(mdxFullPath);
    if (!fs.existsSync(mdxDir)) {
      fs.mkdirSync(mdxDir, { recursive: true });
    }

    console.log(`\nSaving markdown to: ${article.mdxPath}`);
    fs.writeFileSync(mdxFullPath, updatedMarkdown);

    console.log(`✓ Completed: ${article.folder}`);
    console.log(`  - Downloaded: ${imageUrls.length} images`);
    console.log(`  - Saved to: ${outputDir}`);

  } catch (error) {
    console.error(`✗ Error processing ${article.folder}:`, error.message);
  }
}

// Main function
async function main() {
  console.log('Starting download of all Notion images...\n');

  for (const article of articles) {
    await processArticle(article);
    // Delay between articles to be nice to the server
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('All downloads complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);
