/**
 * Leanpub book links. The single place that knows this site's Leanpub
 * coupon codes.
 *
 * The owner created full-price, non-expiring Leanpub coupons so that sales
 * that come from this site are attributed to it in the Leanpub dashboard.
 * A book with a coupon links to https://leanpub.com/<book>/c/<code>; every
 * other book keeps its plain https://leanpub.com/<book> URL.
 *
 * Keep any utm_* query string after the path, e.g.
 * https://leanpub.com/claude-code/c/lucaberton?utm_source=lucaberton.com&...
 */

/** Book slug → this site's Leanpub coupon code. */
export const LEANPUB_COUPONS: Readonly<Record<string, string>> = {
  "claude-code": "lucaberton",
  "Ansible-Automation-Platform": "lucaberton",
};

/**
 * Leanpub URL for a book: the coupon path when this site has a coupon for the
 * book, otherwise the plain book URL. `query` (with or without a leading "?")
 * is appended as-is.
 */
export function leanpubUrl(book: string, query = ""): string {
  const code = LEANPUB_COUPONS[book];
  const base = code
    ? `https://leanpub.com/${book}/c/${code}`
    : `https://leanpub.com/${book}`;
  const q = query.replace(/^\?/, "");
  return q ? `${base}?${q}` : base;
}

/**
 * Leanpub team-discount section of a book page (packs of 3–25 copies). Always
 * the plain book page: the team packs are listed there, not on a coupon page.
 * `query` (with or without a leading "?") goes before the #team-discounts
 * fragment.
 */
export function leanpubTeamUrl(book: string, query = ""): string {
  const q = query.replace(/^\?/, "");
  return `https://leanpub.com/${book}${q ? `?${q}` : ""}#team-discounts`;
}
