// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

const site = 'https://abdula-adil.vercel.app';
const lastmod = new Date();

export default defineConfig({
  site,
  // Directory URLs with a trailing slash ("/about/") everywhere — canonical tags, sitemap and internal links all agree.
  trailingSlash: 'ignore',
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize(item) {
        const path = new URL(item.url).pathname;
        item.lastmod = lastmod.toISOString();
        item.changefreq = path === '/' ? 'weekly' : 'monthly';
        item.priority = path === '/' ? 1.0 : path === '/about/' || path === '/resume/' ? 0.9 : 0.7;
        return item;
      },
    }),
  ],
  build: { inlineStylesheets: 'auto' },
  prefetch: false,
});
