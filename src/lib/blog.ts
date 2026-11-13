import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/** Published posts, newest first. Drafts are included only in `astro dev`. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/**
 * True once at least one post is published. Until then /blog/ is a `noindex` placeholder, so nothing
 * should link to it (or to the empty RSS feed) — internal links to a noindex page are what make
 * Search Console report "Excluded by 'noindex' tag".
 */
export const hasPosts = async (): Promise<boolean> => (await getPosts()).length > 0;

export function readingTime(markdown = ''): number {
  const words = markdown.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
