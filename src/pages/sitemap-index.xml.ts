import { defineMiddleware } from "astro/middleware";

export const onRequest = defineMiddleware(({ locals }, next) => {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap>
        <loc>https://lucaberton.com/sitemap.xml</loc>
      </sitemap>
      <sitemap>
        <loc>https://lucaberton.com/sitemap-blog.xml</loc>
      </sitemap>
      <sitemap>
        <loc>https://lucaberton.com/sitemap-courses.xml</loc>
      </sitemap>
    </sitemapindex>`,
    {
      headers: { "Content-Type": "application/xml" },
    }
  );
});
