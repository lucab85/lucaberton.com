import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export default function sitemapLastmod() {
  return {
    name: 'sitemap-lastmod',
    hooks: {
      'astro:config:setup': async () => {
        const dateMap = new Map();
        const blogDir = join(process.cwd(), 'src/content/blog');
        try {
          const files = await readdir(blogDir);
          for (const file of files) {
            if (!file.endsWith('.mdx')) continue;
            const slug = file.replace('.mdx', '');
            const content = await readFile(join(blogDir, file), 'utf-8');
            const lastMod = content.match(/^lastModified:\s*"?(\d{4}-\d{2}-\d{2})"?/m);
            const pub = content.match(/^publishDate:\s*"?(\d{4}-\d{2}-\d{2})"?/m);
            const date = lastMod?.[1] || pub?.[1];
            if (date) dateMap.set(slug, date + 'T00:00:00+00:00');
          }
          console.log(`[sitemap-lastmod] Loaded ${dateMap.size} blog post dates`);
        } catch (e) {
          console.warn('[sitemap-lastmod] Could not read blog dir:', e.message);
        }
        globalThis.__sitemapDateMap = dateMap;
      }
    }
  };
}
