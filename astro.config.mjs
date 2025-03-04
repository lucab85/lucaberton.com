import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import googleAnalytics from "astro-google-analytics";

// https://astro.build/config
export default defineConfig({
  site: "https://lucaberton.com",
  base: "/",
  integrations: [mdx(), sitemap(), icon(),
    googleAnalytics({
      measurementId: "G-M9Q5F672JT",
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  outDir: 'public',
  publicDir: 'static',
});
