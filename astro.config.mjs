// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://abdula-adil.vercel.app',
  trailingSlash: 'ignore',
  integrations: [react(), sitemap()],
  build: { inlineStylesheets: 'auto' },
  prefetch: false,
});
