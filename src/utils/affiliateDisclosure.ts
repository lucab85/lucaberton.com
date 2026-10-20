/**
 * The single source of truth for the affiliate disclosure wording.
 *
 * "We earn commissions when you shop through the links below" is the exact
 * sentence required by the DigitalOcean affiliate programme for blog posts and
 * web pages. It also satisfies the Amazon Associates operating agreement and
 * the FTC endorsement guidelines. Do not reword it.
 *
 * Used by AffiliateDisclosure.astro (Tailwind pages) and inlined by the two
 * book landing pages, which ship their own CSS instead of Tailwind.
 */
export const AFFILIATE_DISCLOSURE_LABEL = "Disclosure:";
export const AFFILIATE_DISCLOSURE_TEXT =
  "We earn commissions when you shop through the links below, at no additional cost to you. " +
  "Recommendations remain editorially independent.";

/**
 * Affiliate link patterns, matched against a post's raw body.
 *
 * Add a programme here when you join one, and every post that links to it
 * starts showing the disclosure on the next build — there is no per-post flag
 * to remember. Keep these specific: a bare `?ref=` appears in plenty of
 * non-affiliate URLs and would disclose commissions that do not exist.
 */
export const AFFILIATE_LINK_PATTERNS: RegExp[] = [
  /\bamzn\.to\//i,                                // Amazon Associates (short)
  /\bamazon\.[a-z.]{2,}\/[^\s)"']*[?&]tag=/i,      // Amazon Associates (long)
  /\bm\.do\.co\//i,                               // DigitalOcean
  /\bdigitalocean\.com\/[^\s)"']*[?&]refcode=/i,   // DigitalOcean
  /\bmy\.racknerd\.com\/aff\.php/i,               // RackNerd
  /\btrk\.udemy\.com\//i,                         // Udemy via Impact
  /\bawin1\.com\/cread\.php/i,                     // Awin network
  /\btry\.flatpay\.com\//i,                       // Flatpay referral
  /[?&]sca_ref=/i,                                  // Pocket and other SCA links
  /[?&]refcode=/i,                                  // generic refcode
];

/**
 * BlogPromoCard variants whose CTA is an affiliate link. The card injects the
 * URL itself, so it never appears in a post's body — only the invocation
 * `<BlogPromoCard variant="vps" />` does.
 *
 * Source of truth: `affiliateMeta` in src/components/BlogPromoCard.astro. Add a
 * variant there with offerType 'affiliate' and add it here too, or posts using
 * it will carry an undisclosed affiliate link. ('nordicApis' is deliberately
 * absent: it is a media partnership, not a commission.)
 */
export const AFFILIATE_PROMO_VARIANTS = [
  'vps',
  'atoms',
  'claudeBootcamp',
  'udemyCertification',
  'udemySecondChance',
  'pocket',
  'flatpay',
  'linuxFoundation',
] as const;

const PROMO_VARIANT_RE = new RegExp(
  `<BlogPromoCard[^>]*\\bvariant\\s*=\\s*["'](?:${AFFILIATE_PROMO_VARIANTS.join('|')})["']`,
  'i',
);

/** True when the given raw post body carries an affiliate link, directly or via a promo card. */
export function hasAffiliateLinks(source: string | undefined | null): boolean {
  if (!source) return false;
  if (PROMO_VARIANT_RE.test(source)) return true;
  return AFFILIATE_LINK_PATTERNS.some((re) => re.test(source));
}
