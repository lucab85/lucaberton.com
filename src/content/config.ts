// 1. Import utilities from `astro:content`
import { z, defineCollection } from 'astro:content';

// 2. Define your collection(s)
const blogCollection = defineCollection({
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
//    This key should match your collection directory name in "src/content"
export const collections = {
  'blog': blogCollection,
  'team': teamCollection,
};