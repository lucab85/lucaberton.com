import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import react from '@astrojs/react';
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Auto-derive the set of meta-refresh stub redirect pages under
// src/pages/blog/<slug>/index.astro. These are noindex,follow redirect stubs
// (no real content) and MUST be excluded from the sitemap, otherwise Ahrefs/GSC
// flag "Noindex page in sitemap". Scanning the source keeps this list in sync
// automatically as stubs are added/removed (the old hardcoded allowlist drifted
// and leaked 78 stubs into the sitemap).
const stubBlogSlugs = (() => {
  const blogPagesDir = fileURLToPath(new URL("./src/pages/blog/", import.meta.url));
  const slugs = new Set();
  if (!fs.existsSync(blogPagesDir)) return slugs;
  for (const entry of fs.readdirSync(blogPagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const indexPath = path.join(blogPagesDir, entry.name, "index.astro");
    if (!fs.existsSync(indexPath)) continue;
    const src = fs.readFileSync(indexPath, "utf8");
    if (/http-equiv=["']refresh["']/i.test(src)) slugs.add(entry.name);
  }
  return slugs;
})();

// https://astro.build/config
export default defineConfig({
  image: {
    // Use Sharp to generate AVIF/WebP variants and responsive widths.
    // (Previous 'noop' service silently skipped all encoding, leaving Picture
    // outputs as the source JPG/PNG only — major Lighthouse perf hit.)
    service: { entrypoint: "astro/assets/services/sharp" },
    // Emit modern formats automatically for every <Image>/<Picture> and the
    // blog's responsive gallery. AVIF first (best compression), WebP fallback,
    // then the source format. ~50% smaller than shipping the raw JPEG.
    formats: ["avif", "webp", "jpeg"],
    // Allow CSS `aspect-ratio` + `width:100%` on generated images so they can
    // fill responsive containers without layout shift.
    responsiveStyles: true,
  },
  site: "https://lucaberton.com",
  base: "/",
  trailingSlash: "always",
  // Prefetch linked pages on hover/tap so internal navigation feels instant
  // without eagerly fetching every link in the viewport.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  build: {
    // Inline small stylesheets (~4 KB) directly into HTML to eliminate
    // render-blocking CSS chains while letting larger sheets be cached.
    inlineStylesheets: "auto",
  },
  integrations: [
    mdx(),
    react(),
    sitemap({
      // Filter out redirect pages and problematic URLs
      filter: (page) => {
        // Skip team page (it's empty/placeholder)
        if (page.includes('/team')) return false;
        if (page.includes('partytown')) return false;
        if (page.includes('?ref=')) return false;
        if (page.includes('?utm_')) return false;

        // Skip meta-refresh stub redirect pages (noindex,follow) — auto-derived
        // from src/pages/blog/<slug>/index.astro so the list never drifts.
        const blogSlugMatch = page.match(/\/blog\/([^/]+)\/?$/);
        if (blogSlugMatch && stubBlogSlugs.has(blogSlugMatch[1])) return false;
        
        // Skip root-level categories and tags (they redirect to /blog/categories/ and /blog/tags/)
        if (page.match(/\/categories\/[^/]+\/?$/) && !page.includes('/blog/categories/')) return false;
        if (page.match(/\/tags\/[^/]+\/?$/) && !page.includes('/blog/tags/')) return false;
        
        // Skip all redirect pages (old lucaberton.it paths and legacy slugs)
        const redirectPages = [
          '/blog/ansible-for-kubernetes-by-example-with-apress-book',
          '/blog/ansible-for-vmware-by-examples-with-apress-book',
          '/blog/aws_training_and_certification_',
          '/blog/back-end-infrastructure-servers-secure-apis-and-data',
          '/blog/bitcoin',
          '/blog/booklist',
          '/blog/building-blocks-of-the-future',
          '/blog/coursera_google-',
          '/blog/githubarcticcodevault',
          '/blog/googleacademyforads',
          '/blog/hands-on-ansible-automation-by-bpb-online-book',
          '/blog/kcs_',
          '/blog/kubernetes.it',
          '/blog/languagecert_',
          '/blog/linuxfoundationlfce',
          '/blog/localguide',
          '/blog/mobilewebspecialistnanodegree',
          '/blog/newsite',
          '/blog/nexusblod',
          '/blog/red-hat-ansible-automation-platform-book',
          '/blog/redhat_',
          '/blog/responsivedesign',
          '/blog/rhsb-2021-009',
          '/blog/root-cause-analysis',
          '/blog/siteimprovement',
          '/blog/technical-troubleshooting-diagnostics-networks-customers',
          '/blog/webfundamentals',
          '/services/ansible-python-training',
          '/services/ai-integration-green-code',
          '/services/cloud-infrastructure-design',
          '/services/kubernetes-containerization-workshops',
          '/services/automation-strategy-consulting',
          '/services/performance-optimization-custom-solutions',
          '/blog/complete-guide-fullstack-development',
          '/blog/how-to-become-frontend-master',
          '/blog/services',
          '/blog/kubernetes',
          '/blog/categories/books-&-community',
          '/blog/categories/books-&amp;-community',
          '/blog/hcl-vs-json-in-terraform',
          '/products/',
          '/team/',
          '/booklist/',
          '/redhat-summit',
          '/rejekts/',
          '/services/kubernetes-consulting/',
          '/services/platform-engineering/',
        ];
        if (redirectPages.some(p => page.includes(p))) return false;
        
        // Skip blog-old (legacy content)
        if (page.includes('/blog-old')) return false;
        
        // Skip pagination pages (noindexed)
        if (page.match(/\/blog\/\d+\/?$/)) return false;
        
        // Skip search page (noindexed)
        if (page.includes('/blog/search')) return false;
        
        // Skip category redirect pages (conference -> devops, book -> open-source)
        if (page.includes('/blog/categories/conference')) return false;
        if (page.includes('/blog/categories/book')) return false;
        
        // Include all other pages
        return true;
      },
      // Custom serialization to ensure all URLs are canonical with lastmod
      serialize: (item) => {
        let url = item.url;
        url = url.replace(/^http:\/\//, 'https://');
        url = url.replace('://www.', '://');
        if (!url.endsWith('/')) url = url + '/';
        
        const now = new Date().toISOString();
        
        let priority = 0.5;
        if (url === 'https://lucaberton.com/') priority = 1.0;
        else if (url.match(/\/blog\/[^/]+\//) && !url.match(/\/blog\/\d+\//)) priority = 0.8;
        else if (url.match(/\/(about|services|contact|kubecon|book-signing|talk)\//)) priority = 0.9;
        else if (url.match(/\/blog\/\d+\//)) priority = 0.3;
        else if (url.match(/\/blog\/categories\//)) priority = 0.4;
        
        return {
          url,
          lastmod: now,
          changefreq: priority >= 0.8 ? 'weekly' : 'monthly',
          priority
        };
      }
    }),
    icon(),
    (await import("astro-compress")).default({
      CSS: true,  // Astro-compress for minify
      HTML: {
        "html-minifier-terser": {
          removeAttributeQuotes: true,
        },
      },
      Image: false,
      JavaScript: true,
      SVG: true,
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  outDir: "public",
  publicDir: "static",
});
