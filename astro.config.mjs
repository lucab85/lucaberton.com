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
          '/products/',
          '/team/',
        ];
        if (redirectPages.some(p => page.includes(p))) return false;
        
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
