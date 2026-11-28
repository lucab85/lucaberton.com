/**
 * Claude Code Team Kit: the self-serve team product sold on
 * /claude-code-team-kit/ through Stripe Payment Links.
 *
 * TO START SELLING: paste the two Stripe Payment Link URLs below and merge.
 *
 *   INDIVIDUAL_PAYMENT_LINK_URL   Individual, €29, 1 developer
 *   TEAM_PAYMENT_LINK_URL         Team, €149, up to 10 developers in one organisation
 *
 * While a URL is empty, that plan's buttons say "Request access" and go to
 * /contact/?topic=claude-code-team-kit, and the page carries no Product/Offer
 * JSON-LD for it. A Product with an Offer appears only for plans whose link is
 * set.
 *
 * In Stripe, for each Payment Link:
 *   - add a required custom text field "GitHub username" (the read-only invite
 *     to the private repo goes to that account);
 *   - set "After payment" to redirect to
 *     https://lucaberton.com/claude-code-team-kit/thanks/
 *     (that page fires the GA4 event kit_checkout_complete).
 */

export const INDIVIDUAL_PAYMENT_LINK_URL = "";
export const TEAM_PAYMENT_LINK_URL = "";

export type TeamKitPlan = {
  /** GA4 offer_click `offer` value (src/config/analytics-taxonomy.json). */
  offer: "team-kit-individual" | "team-kit-team";
  name: string;
  /** Price in EUR, whole euros. */
  price: number;
  seats: string;
  paymentLinkUrl: string;
};

export const claudeCodeTeamKit = {
  name: "Claude Code Team Kit",
  page: "/claude-code-team-kit/",
  thanksPage: "/claude-code-team-kit/thanks/",
  /** Where the buttons go while a Payment Link is not set. */
  fallbackUrl: "/contact/?topic=claude-code-team-kit",
  currency: "EUR",
  plans: {
    individual: {
      offer: "team-kit-individual",
      name: "Individual",
      price: 29,
      seats: "1 developer",
      paymentLinkUrl: INDIVIDUAL_PAYMENT_LINK_URL,
    },
    team: {
      offer: "team-kit-team",
      name: "Team",
      price: 149,
      seats: "Up to 10 developers in one organisation",
      paymentLinkUrl: TEAM_PAYMENT_LINK_URL,
    },
  } satisfies Record<string, TeamKitPlan>,
};

/** A plan is on sale once its Payment Link is a real https URL. */
export const planLive = (plan: TeamKitPlan): boolean => plan.paymentLinkUrl.trim().startsWith("https://");

/** Checkout link when the plan is on sale, otherwise the contact page. */
export const planHref = (plan: TeamKitPlan): string =>
  planLive(plan) ? plan.paymentLinkUrl.trim() : claudeCodeTeamKit.fallbackUrl;

/** "€29", "€149". */
export const formatEur = (price: number): string => `€${price}`;
