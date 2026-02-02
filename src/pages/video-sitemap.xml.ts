import { getCollection } from 'astro:content';

export async function GET() {
  // Get all blog posts
  const allBlogPosts = await getCollection('blog');
  
  // Filter posts that have video metadata OR contain YouTube components
  const videoPosts = allBlogPosts.filter(post => {
    // Check if post has video metadata in frontmatter
    const hasVideoMeta = (post.data as any).video?.id;
    
    // Check if post content contains YouTube components (rough check)
    const hasYouTubeComponent = post.body.includes('YouTubeVideoSEO') || 
                               post.body.includes('<YouTube id=') ||
                               post.body.includes('youtube.com/embed/') ||
                               post.body.includes('youtube-nocookie.com/embed/');
    
    return hasVideoMeta || hasYouTubeComponent;
  });

  const siteUrl = 'https://lucaberton.com';

  function generateVideoSitemap(posts: any[]) {
    const urlTags = posts.map(post => {
      const video = (post.data as any).video;
      const postUrl = `${siteUrl}/blog/${post.slug}/`;
      
      // If we have video metadata, use it
      if (video?.id) {
        const isoDate = new Date(post.data.publishDate).toISOString();
        return `<url>
    <loc>${postUrl}</loc>
    <video:video>
      <video:thumbnail_loc>${video.thumbnailUrl || `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}</video:thumbnail_loc>
      <video:title><![CDATA[${video.title || post.data.title}]]></video:title>
      <video:description><![CDATA[${video.description || post.data.snippet}]]></video:description>
      <video:content_loc>https://www.youtube.com/watch?v=${video.id}</video:content_loc>
      <video:player_loc>https://www.youtube-nocookie.com/embed/${video.id}</video:player_loc>
      <video:duration>${video.duration || '900'}</video:duration>
      <video:publication_date>${isoDate}</video:publication_date>
      <video:uploader>Luca Berton</video:uploader>
      <video:live>no</video:live>
      <video:family_friendly>yes</video:family_friendly>
    </video:video>
  </url>`;
      } else {
        // Try to extract YouTube ID from content for posts without metadata
        const youtubeMatches = post.body.match(/(?:<YouTube id="|youtube\.com\/watch\?v=|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
        const youtubeId = youtubeMatches ? youtubeMatches[1] : null;
        
        if (youtubeId) {
          const isoDate = new Date(post.data.publishDate).toISOString();
          return `<url>
    <loc>${postUrl}</loc>
    <video:video>
      <video:thumbnail_loc>https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg</video:thumbnail_loc>
      <video:title><![CDATA[${post.data.title}]]></video:title>
      <video:description><![CDATA[${post.data.snippet}]]></video:description>
      <video:content_loc>https://www.youtube.com/watch?v=${youtubeId}</video:content_loc>
      <video:player_loc>https://www.youtube-nocookie.com/embed/${youtubeId}</video:player_loc>
      <video:duration>900</video:duration>
      <video:publication_date>${isoDate}</video:publication_date>
      <video:uploader>Luca Berton</video:uploader>
      <video:live>no</video:live>
      <video:family_friendly>yes</video:family_friendly>
    </video:video>
  </url>`;
        }
      }
      return '';
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