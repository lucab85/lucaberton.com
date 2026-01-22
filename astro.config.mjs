import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import react from '@astrojs/react';
import partytown from "@astrojs/partytown"; // Corrected import

// https://astro.build/config
export default defineConfig({
  site: "https://lucaberton.com",
  base: "/",
  trailingSlash: "always",
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
        
        // Skip root-level categories and tags (they redirect to /blog/categories/ and /blog/tags/)
        if (page.match(/\/categories\/[^/]+\/?$/) && !page.includes('/blog/categories/')) return false;
        if (page.match(/\/tags\/[^/]+\/?$/) && !page.includes('/blog/tags/')) return false;
        
        // Skip legacy blog posts that redirect (as per _redirects file)
        const redirectedBlogPosts = [
          '/blog/complete-guide-fullstack-development',
          '/blog/how-to-become-frontend-master',
          '/blog/coursera_google-cloud-platform-fundamentals.it',
          '/blog/kubernetes.it',
          '/blog/responsivedesign',
          '/blog/siteimprovement.it',
          '/blog/redhat_do280',
          '/blog/kcs_googletags',
          '/blog/bitcoin',
          '/blog/webfundamentals',
          '/blog/coursera_google-it-support',
          '/blog/languagecert_international_esol_selt_b1',
          '/blog/services',
        ];
        if (redirectedBlogPosts.some(post => page.includes(post))) return false;
        
        // Skip blog-old (legacy content)
        if (page.includes('/blog-old')) return false;
        
        // Include all other pages
        return true;
      },
      // Custom serialization to ensure all URLs are canonical (https, no www, with trailing slash)
      serialize: (item) => {
        // Normalize the URL to canonical form
        let url = item.url;
        
        // Replace http with https
        url = url.replace(/^http:\/\//, 'https://');
        
        // Remove www prefix
        url = url.replace('://www.', '://');
        
        // Ensure trailing slash for all URLs
        if (!url.endsWith('/')) {
          url = url + '/';
        }
        
        return {
          url: url,
          lastmod: item.lastmod,
          changefreq: item.changefreq,
          priority: item.priority
        };
      }
    }),
    icon(),
    partytown({ config: { forward: ["dataLayer.push"] } }), // Using the correct import
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
