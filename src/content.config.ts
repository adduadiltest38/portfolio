import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Blog posts: one Markdown file per post in src/content/blog/.
// The file name becomes the URL: `whisper-kokoro-react-native.md` → /blog/whisper-kokoro-react-native/
// Files starting with "_" (like _template.md) are ignored.
const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: z.object({
    /** Shown in Google results — keep under ~60 characters, main search phrase first. */
    title: z.string().max(70),
    /** Shown under the title in Google results — 120–160 characters. */
    description: z.string().min(50).max(160),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    /** Optional share image (link previews on LinkedIn/X, Google article image): a 1200×630 JPG or PNG in public/, e.g. '/blog/my-post/og.jpg'. */
    image: z.string().startsWith('/').optional(),
    imageAlt: z.string().optional(),
    /** Optional link to a project case study: plant | pid | erp | aips */
    project: z.enum(['plant', 'pid', 'erp', 'aips']).optional(),
    /** Drafts show in `npm run dev` but are never published. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
