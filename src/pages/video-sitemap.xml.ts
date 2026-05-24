import { getCollection } from 'astro:content';

export async function GET() {
  // Get all blog posts
  const allBlogPosts = await getCollection('blog');
  
  // Filter posts that have video metadata OR contain YouTube components
  const videoPosts = allBlogPosts.filter(post => {
    // Check if post has video metadata in frontmatter
    const hasVideoMeta = (post.data as any).video?.id;
    
    // Check if post content contains YouTube components (rough check)
    const body = post.body ?? '';
    const hasYouTubeComponent = body.includes('YouTubeVideoSEO') || 
                               body.includes('<YouTube id=') ||
                               body.includes('youtube.com/embed/') ||
                               body.includes('youtube-nocookie.com/embed/');
    
    return hasVideoMeta || hasYouTubeComponent;
  });

  const siteUrl = 'https://lucaberton.com';

  function generateVideoSitemap(posts: any[]) {
    const ytIdRegex = /(?:<YouTube\s+id=["']|youtube\.com\/watch\?v=|youtube-nocookie\.com\/embed\/|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
    const urlTags = posts.map(post => {
      const video = (post.data as any).video;
      const postUrl = `${siteUrl}/blog/${post.slug}/`;
      const bodyContent = post.body ?? '';
      const isoDate = new Date(post.data.publishDate).toISOString();

      // Collect every YouTube ID referenced anywhere in the post body, plus the
      // primary one from frontmatter video.id, so multi-video posts produce
      // multiple <video:video> blocks instead of just one.
      const idsFromBody = Array.from(new Set(Array.from(bodyContent.matchAll(ytIdRegex), (m: any) => m[1]))) as string[];
      const ids: string[] = [];
      if (video?.id) ids.push(video.id);
      for (const id of idsFromBody) {
        if (!ids.includes(id)) ids.push(id);
      }
      if (ids.length === 0) return '';

      const blocks = ids.map((id, idx) => {
        const isPrimary = video?.id === id;
        const vTitle = isPrimary && video?.title
          ? video.title
          : (idx === 0 ? post.data.title : `${post.data.title} — clip ${idx + 1}`);
        const vDesc = isPrimary && video?.description
          ? video.description
          : (post.data.snippet || post.data.description || post.data.title);
        const vThumb = isPrimary && video?.thumbnailUrl
          ? video.thumbnailUrl
          : `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
        const vDuration = isPrimary && video?.duration
          ? (typeof video.duration === 'string' && video.duration.startsWith('PT') ? '' : video.duration)
          : '';
        const durationTag = vDuration ? `      <video:duration>${vDuration}</video:duration>\n` : '';
        return `    <video:video>
      <video:thumbnail_loc>${vThumb}</video:thumbnail_loc>
      <video:title><![CDATA[${vTitle}]]></video:title>
      <video:description><![CDATA[${vDesc}]]></video:description>
      <video:content_loc>https://www.youtube.com/watch?v=${id}</video:content_loc>
      <video:player_loc>https://www.youtube-nocookie.com/embed/${id}</video:player_loc>
${durationTag}      <video:publication_date>${isoDate}</video:publication_date>
      <video:uploader>Luca Berton</video:uploader>
      <video:live>no</video:live>
      <video:family_friendly>yes</video:family_friendly>
    </video:video>`;
      }).join('\n');

      return `<url>
    <loc>${postUrl}</loc>
${blocks}
  </url>`;
    }).filter(Boolean).join('\n');

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