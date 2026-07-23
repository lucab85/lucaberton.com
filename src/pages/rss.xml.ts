import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async () => {
  const posts = (await getCollection("blog", ({ data }) => !data.draft))
    .sort((a, b) => new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime())
    .slice(0, 50);

  const site = "https://lucaberton.com";
  const buildDate = new Date().toUTCString();

  const escXml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escXml(post.data.title)}</title>
      <link>${site}/blog/${post.slug}/</link>
      <guid isPermaLink="true">${site}/blog/${post.slug}/</guid>
      <description>${escXml(post.data.snippet ?? "")}</description>
      <pubDate>${new Date(post.data.publishDate).toUTCString()}</pubDate>
      <author>luca@lucaberton.com (Luca Berton)</author>
      <category>${escXml(post.data.category ?? "")}</category>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Luca Berton | AI &amp; Cloud Blog</title>
    <description>Insights on AI, Kubernetes, Ansible, cloud infrastructure, and automation by Luca Berton.</description>
    <link>${site}</link>
    <atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml" />
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <managingEditor>luca@lucaberton.com (Luca Berton)</managingEditor>
    <webMaster>luca@lucaberton.com (Luca Berton)</webMaster>
    <image>
      <url>${site}/opengraph.jpg</url>
      <title>Luca Berton | AI &amp; Cloud Blog</title>
      <link>${site}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
