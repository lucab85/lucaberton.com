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
  trailingSlash: "ignore",
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
        
        // Include all other pages
        return true;
      },
      // Custom serialization to ensure all URLs are canonical (https, no www, no trailing slash)
      serialize: (item) => {
        // Normalize the URL to canonical form
        let url = item.url;
        
        // Replace http with https
        url = url.replace(/^http:\/\//, 'https://');
        
        // Remove www prefix
        url = url.replace('://www.', '://');
        
        // Remove trailing slash (except for root)
        if (url.endsWith('/') && url !== 'https://lucaberton.com/') {
          url = url.slice(0, -1);
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
