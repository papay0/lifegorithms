# Blog Migration Summary

## Overview
Successfully migrated 13 blog posts from the old lifegorithms.com repository to the new Next.js MDX-based blog.

## Migration Details

### Posts Migrated by Year:
- **2016**: 2 posts
  - IBM Extreme Blue 2016 🍻
  - Lifegorithms, what is it about? 🤔

- **2018**: 1 post
  - Uber UX Research Trip 🇲🇽

- **2019**: 1 post
  - My Facebook F8/Hackathons 2019 Experience 😍

- **2020**: 5 posts
  - Amazon Charging Nightstand 2020 🧰
  - Day2Day, your task manager on Google Docs 🤓
  - Mentoring & Hackathons 🤝
  - What I wish someone would have told me about money management 💸
  - 2020 - Year in Review 🌎

- **2021**: 3 posts
  - Reverse engineering Robinhood to create SoTrade 📈
  - VISAs in the US 🇺🇸
  - Weekly Personal Challenges ✅

- **2022**: 1 post
  - San Francisco · Beer gardens adventures 🍺

### Total: 13 posts migrated

## What Was Done

1. **Content Migration**
   - Converted frontmatter from old format to new MDX format
   - Added emoji icons to each post
   - Converted relative image paths from `./image.png` to `/images/slug/image.png`
   - Fixed internal links to use new URL structure
   - Removed localhost URLs and fixed anchor links

2. **Image Migration**
   - Copied all images (110+ files) from old blog folders to `/public/images/`
   - Organized images by post slug for easy management
   - Preserved original image names and formats

3. **Metadata Transformation**
   - Old format: `title`, `date`, `spoiler`, `category`, `published`
   - New format: `title`, `emoji`, `date`, `draft`, `tags`, `description`
   - Mapped `spoiler` → `description`
   - Mapped `category` → `tags`
   - Mapped `published` → `draft` (inverted)

## Posts Not Migrated

The following posts from the Notion blog were NOT found in the old repository:
- 2023 - Year in Review 🌎
- 2022 - Year in Review 🌎
- 2021 - Year in Review 🌎
- Asia 2023 (Singapore, Thailand, South Korea, Taiwan & Japan) 🌏
- My life learnings & values 🧬
- Inbox 0 • Productivity hack 📨

**These posts appear to exist only on Notion and would need to be manually exported and migrated.**

## Technical Notes

- Migration script: `/scripts/migrate-posts.js`
- All migrated posts are in: `/content/posts/YEAR/slug.mdx`
- All images are in: `/public/images/slug/`
- Posts maintain their original publication dates and content

## Next Steps

To complete the blog migration:
1. Manually export missing posts from Notion
2. Add them to the appropriate year folders
3. Ensure all images for those posts are added to `/public/images/`
4. Test all posts to ensure images load correctly
5. Verify all internal and external links work

## Migration Script

The migration was automated using Node.js. The script:
- Reads all folders in the old blog's `src/pages` directory
- Parses markdown frontmatter
- Converts content and paths
- Copies images to the public folder
- Generates new MDX files with correct frontmatter

Run migration again (if needed):
```bash
node scripts/migrate-posts.js
```
