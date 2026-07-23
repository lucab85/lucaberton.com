/**
 * Estimate reading time for a blog post body.
 * @param content - Raw text/markdown content
 * @param wordsPerMinute - Average reading speed (default 200)
 * @returns Formatted string like "5 min read"
 */
export function getReadingTime(content: string, wordsPerMinute = 200): string {
  // Strip markdown/html tags for word count
  const text = content
    .replace(/<[^>]*>/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    .replace(/[#*_~>\-|]/g, '')
    .trim();

  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / wordsPerMinute));
  return `${minutes} min read`;
}
