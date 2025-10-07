import { getCollection } from 'astro:content';

export async function GET() {
  // Get all blog posts with videos
  const allBlogPosts = await getCollection('blog');
  const videoPosts = allBlogPosts.filter(post => (post.data as any).video?.id);

  const siteUrl = 'https://lucaberton.com';

  function generateVideoSitemap(posts: any[]) {
    const urlTags = posts.map(post => {
      const video = (post.data as any).video;
      const postUrl = `${siteUrl}/blog/${post.slug}`;
      
      return `<url>
    <loc>${postUrl}</loc>
    <video:video>
      <video:thumbnail_loc>${video.thumbnailUrl || `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}</video:thumbnail_loc>
      <video:title><![CDATA[${video.title || post.data.title}]]></video:title>
      <video:description><![CDATA[${video.description || post.data.snippet}]]></video:description>
      <video:content_loc>https://www.youtube.com/watch?v=${video.id}</video:content_loc>
      <video:player_loc>https://www.youtube-nocookie.com/embed/${video.id}</video:player_loc>
      <video:duration>${video.duration || 'PT10M'}</video:duration>
      <video:publication_date>${post.data.publishDate}</video:publication_date>
      <video:uploader>Luca Berton</video:uploader>
      <video:uploader_info>https://lucaberton.com</video:uploader_info>
      <video:live>no</video:live>
      <video:family_friendly>yes</video:family_friendly>
    </video:video>
  </url>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urlTags}
</urlset>`;
  }

  const sitemap = generateVideoSitemap(videoPosts);

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}