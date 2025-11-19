# Lifegorithms Blog

Personal blog by Arthur Papailhau, Software Engineer at Uber (Eats). Built with Next.js, MDX, and TailwindCSS.

## Features

- **Server-Side Rendering**: Built with Next.js 16 for optimal performance
- **MDX Support**: Write blog posts with React components embedded in markdown
- **Draft Mode**: Mark posts as drafts to hide them from public view
- **Search**: Fast client-side search with keyboard shortcut (⌘K)
- **Tags & Categories**: Organize posts with tags
- **Reading Time**: Automatically calculated reading time for each post
- **SEO Optimized**: Meta tags, Open Graph, and Twitter Cards
- **Year-Based Organization**: Posts organized by year folders
- **Responsive Design**: Beautiful UI with warm blue colors

## Project Structure

```
lifegorithms/
├── app/
│   ├── blog/[year]/[slug]/
│   │   └── page.tsx          # Individual blog post page
│   ├── layout.tsx             # Root layout with navigation
│   └── page.tsx               # Homepage with article list
├── components/
│   ├── footer.tsx             # Site footer
│   ├── mdx-content.tsx        # MDX renderer with custom components
│   ├── navigation.tsx         # Top navigation bar
│   └── search.tsx             # Search functionality
├── content/
│   └── posts/
│       ├── 2024/
│       │   └── example-post.mdx
│       ├── 2023/
│       └── 2022/
├── lib/
│   └── posts.ts               # Blog post utilities
└── utils/
```

## Writing Blog Posts

### Create a New Post

1. Create a new `.mdx` file in the appropriate year folder:
   ```bash
   content/posts/2024/my-new-post.mdx
   ```

2. Add frontmatter at the top of the file:
   ```yaml
   ---
   title: "Your Post Title"
   emoji: "🎉"
   date: "2024-01-15"
   draft: false
   tags: ["technology", "life"]
   description: "A short description of your post"
   ---
   ```

3. Write your content using markdown or MDX

### Frontmatter Fields

- `title` (required): Post title
- `emoji` (optional): Emoji icon for the post
- `date` (required): Publication date (YYYY-MM-DD)
- `draft` (optional): Set to `true` to hide from public
- `tags` (optional): Array of tags for categorization
- `description` (optional): Short description for SEO and previews

### MDX Features

You can use React components in your posts:

```mdx
# My Post

Here's some regular markdown text.

<CustomComponent prop="value" />

You can also use **bold**, *italic*, and [links](https://example.com).
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Configuration

### Change Site Metadata

Edit `app/layout.tsx` to update site title, description, and social media metadata.

### Customize Colors

The blog uses a warm blue color scheme. To customize:
- Edit Tailwind classes in components
- Main colors: `blue-50`, `blue-100`, `blue-400`, `blue-500`, `blue-600`, `blue-700`

### Add Custom MDX Components

Edit `components/mdx-content.tsx` to add or customize components available in MDX posts.

## Deployment

This blog can be deployed to any platform that supports Next.js:

- **Vercel** (recommended): Automatic deployments with git integration
- **Netlify**: Configure build command `npm run build` and publish directory `.next`
- **Self-hosted**: Build and run with `npm run build && npm start`

## Draft Mode

Posts with `draft: true` in frontmatter won't appear on the public site. This allows you to work on posts over time.

To preview drafts locally, you can temporarily modify `lib/posts.ts` to pass `includeDrafts: true`.

## Search

The search feature (⌘K or Ctrl+K) allows visitors to quickly find articles by:
- Title
- Description
- Tags

Search is implemented client-side for instant results.

## License

© 2024 Arthur Papailhau. All rights reserved.
