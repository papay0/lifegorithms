const fs = require('fs');
const path = require('path');

const OLD_BLOG_PATH = '/Users/papay0/Dev/lifegorithms.com/src/pages';
const NEW_BLOG_PATH = '/Users/papay0/Dev/lifegorithms/content/posts';
const PUBLIC_IMAGES_PATH = '/Users/papay0/Dev/lifegorithms/public/images';

// Emoji mapping based on category/title
const emojiMap = {
  'f8-2019': '😍',
  'review-2020': '🌎',
  'review-2021': '🌎',
  'review-2022': '🌎',
  'review-2023': '🌎',
  'SoTrade': '📈',
  'money-management-learnings': '💸',
  'amazon-night-stand-2020': '🧰',
  'hackathons-mentor': '🤝',
  'day2day': '🤓',
  'ibm-extreme-blue-2016-internship': '🍻',
  'lifegorithms-goal': '🤔',
  'us-visas': '🇺🇸',
  'weekly-personal-challenges': '✅',
  'ux-research-mexico-uber': '🇲🇽',
};

function extractYearFromDate(dateString) {
  const date = new Date(dateString);
  return date.getFullYear().toString();
}

function convertToMDX(content, slug, folderPath) {
  let mdxContent = content;

  // Convert local image paths to public paths
  // From: ![text](./image.png)
  // To: ![text](/images/slug/image.png)
  mdxContent = mdxContent.replace(/!\[([^\]]*)\]\(\.\/([^)]+)\)/g, `![$1](/images/${slug}/$2)`);

  return mdxContent;
}

function migratePosts() {
  // Create public images directory if it doesn't exist
  if (!fs.existsSync(PUBLIC_IMAGES_PATH)) {
    fs.mkdirSync(PUBLIC_IMAGES_PATH, { recursive: true });
  }

  // Get all folders in the old blog
  const folders = fs.readdirSync(OLD_BLOG_PATH, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const migrations = [];

  folders.forEach(folder => {
    const indexPath = path.join(OLD_BLOG_PATH, folder, 'index.md');

    if (!fs.existsSync(indexPath)) {
      console.log(`Skipping ${folder} - no index.md found`);
      return;
    }

    // Read the old post
    const content = fs.readFileSync(indexPath, 'utf8');

    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      console.log(`Skipping ${folder} - no frontmatter found`);
      return;
    }

    const [, frontmatter, body] = frontmatterMatch;

    // Parse frontmatter
    const metadata = {};
    frontmatter.split('\n').forEach(line => {
      const match = line.match(/^(\w+):\s*['"]?([^'"]+)['"]?$/);
      if (match) {
        metadata[match[1]] = match[2];
      }
    });

    if (!metadata.published || metadata.published !== 'true') {
      console.log(`Skipping ${folder} - not published`);
      return;
    }

    const year = extractYearFromDate(metadata.date);
    const emoji = emojiMap[folder] || '📝';
    const slug = folder;

    // Create new frontmatter
    const newFrontmatter = `---
title: "${metadata.title.replace(/["']/g, '')}"
emoji: "${emoji}"
date: "${metadata.date}"
draft: false
tags: ["${metadata.category || 'article'}"]
description: "${metadata.spoiler?.replace(/["']/g, '') || ''}"
---`;

    // Convert content to MDX
    const mdxBody = convertToMDX(body, slug, path.join(OLD_BLOG_PATH, folder));
    const newContent = `${newFrontmatter}\n${mdxBody}`;

    // Create year folder if it doesn't exist
    const yearPath = path.join(NEW_BLOG_PATH, year);
    if (!fs.existsSync(yearPath)) {
      fs.mkdirSync(yearPath, { recursive: true });
    }

    // Write the new post
    const newPostPath = path.join(yearPath, `${slug}.mdx`);
    fs.writeFileSync(newPostPath, newContent);

    // Copy images
    const oldFolderPath = path.join(OLD_BLOG_PATH, folder);
    const imageDestPath = path.join(PUBLIC_IMAGES_PATH, slug);

    if (!fs.existsSync(imageDestPath)) {
      fs.mkdirSync(imageDestPath, { recursive: true });
    }

    // Copy all image files
    const files = fs.readdirSync(oldFolderPath);
    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) {
        const src = path.join(oldFolderPath, file);
        const dest = path.join(imageDestPath, file);
        fs.copyFileSync(src, dest);
        console.log(`Copied image: ${file}`);
      }
    });

    migrations.push({
      folder,
      slug,
      year,
      title: metadata.title,
      date: metadata.date,
    });

    console.log(`✅ Migrated: ${metadata.title} (${year}/${slug})`);
  });

  console.log(`\n📊 Migration Summary:`);
  console.log(`Total posts migrated: ${migrations.length}`);
  console.log(`\nPosts by year:`);
  const byYear = migrations.reduce((acc, m) => {
    acc[m.year] = (acc[m.year] || 0) + 1;
    return acc;
  }, {});
  Object.keys(byYear).sort().forEach(year => {
    console.log(`  ${year}: ${byYear[year]} posts`);
  });
}

try {
  migratePosts();
  console.log('\n✨ Migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
