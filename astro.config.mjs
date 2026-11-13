// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

const site = 'https://abdula-adil.vercel.app';
const lastmod = new Date();

// Keep the empty /blog/ page out of the sitemap (it is also noindex) until the first post is published.
const blogDir = new URL('./src/content/blog/', import.meta.url);
// A post counts once it is not a draft and its pubDate has arrived (same rule as getPosts() in src/lib/blog.ts).
const isPublished = (src) => {
  if (/^draft:\s*true\s*$/m.test(src)) return false;
  const date = src.match(/^pubDate:\s*['"]?([^'"\s#]+)/m)?.[1];
  return !date || new Date(date) <= lastmod;
};
const hasPosts = readdirSync(blogDir).some(
  (f) => f.endsWith('.md') && !f.startsWith('_') && isPublished(readFileSync(new URL(f, blogDir), 'utf8')),
);

export default defineConfig({
  site,
  // Directory URLs with a trailing slash ("/about/") everywhere — canonical tags, sitemap and internal links all agree.
  trailingSlash: 'ignore',
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/404') && (hasPosts || !page.endsWith('/blog/')),
      serialize(item) {
        const path = new URL(item.url).pathname;
        item.lastmod = lastmod.toISOString();
        item.changefreq = path === '/' ? 'weekly' : 'monthly';
        item.priority = path === '/' ? 1.0 : ['/about/', '/resume/', '/blog/'].includes(path) ? 0.9 : 0.7;
        return item;
      },
    }),
  ],
  build: { inlineStylesheets: 'auto' },
  prefetch: false,
});
