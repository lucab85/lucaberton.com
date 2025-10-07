import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
  const url = context.url;
  
  // Force HTTPS redirect
  if (url.protocol === 'http:') {
    return Response.redirect(`https://${url.host}${url.pathname}${url.search}`, 301);
  }
  
  // Redirect www to non-www
  if (url.hostname === 'www.lucaberton.com') {
    return Response.redirect(`https://lucaberton.com${url.pathname}${url.search}`, 301);
  }
  
  // Handle trailing slash redirects (except for root)
  if (url.pathname.endsWith('/') && url.pathname !== '/') {
    return Response.redirect(`${url.origin}${url.pathname.slice(0, -1)}${url.search}`, 301);
  }
  
  // Category and tag redirects
  if (url.pathname.startsWith('/categories/')) {
    const slug = url.pathname.replace('/categories/', '').replace('/', '');
    return Response.redirect(`${url.origin}/blog/categories/${slug}`, 301);
  }
  
  if (url.pathname.startsWith('/tags/')) {
    const slug = url.pathname.replace('/tags/', '').replace('/', '');
    return Response.redirect(`${url.origin}/blog/tags/${slug}`, 301);
  }
  
  return next();
});