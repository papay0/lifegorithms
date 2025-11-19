const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');
const path = require('path');
const https = require('https');

// Read the HTML file
const htmlPath = path.join(__dirname, '../content/posts/2023/html.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const dom = new JSDOM(html);
const document = dom.window.document;

// Image directory
const imageDir = path.join(__dirname, '../public/images/inbox-0');
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

// Find the flowchart image
const images = document.querySelectorAll('img');
let flowchartUrl = null;

for (const img of images) {
  const src = img.getAttribute('src');
  if (src && src.includes('Flowchart')) {
    flowchartUrl = 'https://www.notion.so' + src;
    console.log('Found flowchart:', flowchartUrl);
    break;
  }
}

// Download the flowchart
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Downloaded: ${filepath}`);
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

async function main() {
  if (flowchartUrl) {
    const flowchartPath = path.join(imageDir, 'flowchart.png');
    await downloadImage(flowchartUrl, flowchartPath);
  }

  // Create the MDX content
  const mdx = `---
title: "Inbox 0 • Productivity hack"
emoji: "📨"
date: "2022-06-27"
draft: false
tags: ["article", "productivity"]
description: "A simple flowchart to achieve and maintain Inbox 0"
---

> **Note:** This article was originally published on [Notion](https://lifegorithms.notion.site/Inbox-0-Productivity-hack-June-27-2022-5d5b7791f4e4457797dbee8c839a7b69).

**Inbox 0** is probably one of the most powerful productivity hacks that I learned. It's especially useful to reduce mental stress, and feel less overwhelmed by the amount of unread emails. I know you might think it's impossible, but it's not!

## What are the benefits?

> "Inbox Zero is a rigorous approach to email management aimed at keeping your inbox empty — or almost empty — at all times."
>
> *From [inc.com](https://www.inc.com/young-entrepreneur-council/9-inbox-zero-strategies-that-actually-work.html)*

![](/images/inbox-0/flowchart.png)

## Can I just mark it as read?

**NO!** That's cheating! The goal is to have an empty inbox, not just to mark everything as read.

## I LIKE IT, WHAT'S THE TRICK??!

The trick is to use a simple flowchart to decide what to do with each email. Here's how it works:

### First step

Archive everything! Yes, everything. If you have 1000 unread emails, just archive them all. You can always search for them later if you need them. This will give you a clean slate to start with.

### Does it require an action?

If the email doesn't require any action from you, just archive it. It's that simple.

### Does it take more than 2 minutes?

If the action takes less than 2 minutes, just do it now. Reply to the email, or do whatever needs to be done.

If it takes more than 2 minutes, you need to decide if you can do it now or later.

### Can you do it now?

If you can do it now, just do it. If you can't, create a task in your todo list, and archive the email.

## Conclusion

That's it! It's that simple. The key is to make a decision for each email, and not let them pile up in your inbox. This will help you stay organized and reduce stress.
`;

  const mdxPath = path.join(__dirname, '../content/posts/2022/inbox-0-productivity-hack.mdx');
  fs.writeFileSync(mdxPath, mdx);
  console.log(`\nCreated: ${mdxPath}`);
}

main().catch(console.error);
