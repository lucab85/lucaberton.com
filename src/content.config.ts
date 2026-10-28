// 1. Import utilities. Since Astro 6 every collection needs a loader and
//    lives in src/content.config.ts; `z` comes from astro/zod.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// 2. Define your collection(s)
const blogCollection = defineCollection({
  // IDs are the slugified file paths, the same values as the old `slug`, so
  // every /blog/<id>/ URL stays as it was.
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    draft: z.boolean(),
    title: z.string(),
    seoTitle: z.string().optional(),
    // Absolute URL of the primary version when this topic is owned by another
    // site (e.g. openempower.com). Emitted as the page's rel=canonical.
    canonical: z.string().url().optional(),
    snippet: z.string(),
    image: z.object({
      src: z.string(),
      alt: z.string(),
    }),
    publishDate: z.string().transform(str => new Date(str)),
    lastModified: z.string().optional(),
    author: z.string().default('Luca Berton'),
    // Force the affiliate disclosure on. Normally unnecessary: the blog
    // template detects affiliate links in the post body by itself.
    affiliate: z.boolean().optional(),
    category: z.string(),
    tags: z.array(z.string()),
    faq: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
    // Event recaps: structured facts about the event the post covers. Drives
    // the /events/ topic and company hubs and the Event JSON-LD. Only facts
    // stated in the post itself (see src/utils/eventTopics.ts for topic slugs).
    event: z.object({
      name: z.string(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      dateApprox: z.boolean().optional(),
      city: z.string().optional(),
      country: z.string().length(2).optional(),
      venue: z.string().optional(),
      organizer: z.string().optional(),
      url: z.string().url().optional(),
      role: z.enum(['attendee', 'speaker', 'mc', 'media', 'volunteer', 'exhibitor', 'organizer']).default('attendee'),
      series: z.boolean().optional(),
      companies: z.array(z.string()).default([]),
      speakers: z.array(z.object({ name: z.string(), company: z.string().optional() })).default([]),
      topics: z.array(z.string()).default([]),
    }).optional(),
  }),
});

const teamCollection = defineCollection({
  // IDs are the slugified file paths, the same values as the old `slug`, so
  // every /blog/<id>/ URL stays as it was.
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/team' }),
  schema: z.object({
    draft: z.boolean(),
    name: z.string(),
    title: z.string(),
    avatar: z.object({
      src: z.string(),
      alt: z.string(),
    }),
    publishDate: z.string().transform(str => new Date(str)),
  }),
});

// 3. Export a single `collections` object to register your collection(s)
export const collections = {
  'blog': blogCollection,
  'team': teamCollection,
};