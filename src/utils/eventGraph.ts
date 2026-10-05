/**
 * Event graph: the event recaps grouped by topic and by company, built from the
 * `event` frontmatter. Hubs are only generated (and only linked) above a minimum
 * size, so no thin pages are created — the old /tags/ pages were 301'd for that.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { eventTopics, eventOffers, type EventOffer } from '@utils/eventTopics';

export type EventPost = CollectionEntry<'blog'> & {
  data: CollectionEntry<'blog'>['data'] & { event: NonNullable<CollectionEntry<'blog'>['data']['event']> };
};

export const MIN_TOPIC_POSTS = 5;
export const MIN_COMPANY_POSTS = 4;
/** A company hub also needs this many distinct events (not one summit's posts). */
export const MIN_COMPANY_EVENTS = 2;

export function slugify(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

let cache: EventPost[] | undefined;

/** Published posts with event metadata, newest event first. */
export async function getEventPosts(): Promise<EventPost[]> {
  if (cache) return cache;
  const all = await getCollection('blog', ({ data }) => !data.draft && !!data.event);
  cache = (all as EventPost[]).sort((a, b) => b.data.event.startDate.localeCompare(a.data.event.startDate));
  return cache;
}

function group(posts: EventPost[], keys: (p: EventPost) => string[]): Map<string, EventPost[]> {
  const m = new Map<string, EventPost[]>();
  for (const p of posts) {
    for (const k of new Set(keys(p))) {
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(p);
    }
  }
  return m;
}

/** topic slug -> posts, only topics defined in eventTopics and above the minimum. */
export async function topicHubs(): Promise<Map<string, EventPost[]>> {
  const g = group(await getEventPosts(), (p) => p.data.event.topics.filter((t) => t in eventTopics));
  return new Map([...g].filter(([, ps]) => ps.length >= MIN_TOPIC_POSTS));
}

/** company slug -> { name, posts }, above the minimum. */
export async function companyHubs(): Promise<Map<string, { name: string; posts: EventPost[] }>> {
  const posts = await getEventPosts();
  const names = new Map<string, Map<string, number>>();
  for (const p of posts) {
    for (const c of p.data.event.companies) {
      const s = slugify(c);
      if (!names.has(s)) names.set(s, new Map());
      names.get(s)!.set(c, (names.get(s)!.get(c) ?? 0) + 1);
    }
  }
  const g = group(posts, (p) => p.data.event.companies.map(slugify));
  const out = new Map<string, { name: string; posts: EventPost[] }>();
  for (const [s, ps] of g) {
    if (ps.length < MIN_COMPANY_POSTS) continue;
    if (new Set(ps.map((p) => p.data.event.name)).size < MIN_COMPANY_EVENTS) continue;
    const name = [...names.get(s)!].sort((a, b) => b[1] - a[1])[0][0];
    out.set(s, { name, posts: ps });
  }
  return new Map([...out].sort((a, b) => b[1].posts.length - a[1].posts.length));
}

export function formatEventDate(e: EventPost['data']['event']): string {
  const d = new Date(`${e.startDate}T12:00:00Z`);
  const opts: Intl.DateTimeFormatOptions = e.dateApprox
    ? { month: 'long', year: 'numeric', timeZone: 'UTC' }
    : { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' };
  return d.toLocaleDateString('en-GB', opts);
}

export interface EventContext {
  siblings: EventPost[];
  topics: { slug: string; label: string; count: number }[];
  companies: { slug: string; name: string; count: number }[];
  guides: CollectionEntry<'blog'>[];
  offer?: EventOffer;
}

/** Everything the "From this event" box under an event recap links to. */
export async function eventTopicLinksFor(entry: CollectionEntry<'blog'>): Promise<EventContext | undefined> {
  const ev = entry.data.event;
  if (!ev) return undefined;
  const posts = await getEventPosts();
  const siblings = ev.series
    ? []
    : posts.filter((p) => p.slug !== entry.slug && p.data.event.name === ev.name).slice(0, 8);
  const th = await topicHubs();
  const topics = ev.topics
    .filter((t) => th.has(t))
    .map((t) => ({ slug: t, label: eventTopics[t].label, count: th.get(t)!.length }));
  const ch = await companyHubs();
  const companies = [...new Set(ev.companies.map(slugify))]
    .filter((s) => ch.has(s))
    .map((s) => ({ slug: s, name: ch.get(s)!.name, count: ch.get(s)!.posts.length }));
  // Guides and offer come from the post's most central topic that defines them
  const all = await getCollection('blog', ({ data }) => !data.draft);
  const guideSlugs = [...new Set(ev.topics.flatMap((t) => eventTopics[t]?.guides ?? []))].filter((s) => s !== entry.slug);
  const guides = guideSlugs.map((s) => all.find((p) => p.slug === s)).filter((p): p is CollectionEntry<'blog'> => !!p).slice(0, 3);
  const offerKey = ev.topics.map((t) => eventTopics[t]?.offer).find(Boolean);
  return { siblings, topics, companies, guides, offer: offerKey ? eventOffers[offerKey] : undefined };
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** First candidate within the SEO title limit (validate-seo-fixes: <= 60). */
export function fitTitle(...candidates: string[]): string {
  return candidates.find((c) => c.length <= 60) ?? candidates[candidates.length - 1].slice(0, 60);
}

/** First candidate within the meta description window (120–160), else the first <= 160. */
export function fitDescription(...candidates: string[]): string {
  return (
    candidates.find((c) => c.length >= 120 && c.length <= 160) ??
    candidates.find((c) => c.length <= 160) ??
    candidates[candidates.length - 1].slice(0, 160)
  );
}
