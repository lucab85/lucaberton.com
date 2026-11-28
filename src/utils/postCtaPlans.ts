/**
 * Per-post CTA plans for the Claude Code / Codex error posts, keyed by slug.
 *
 * A post listed here drops the usual stack of offers (topic banner, sponsored
 * banner, doctor strip, product banner, newsletter card, consulting card,
 * course cards, paid-offer cards, sticky bar, the closing consulting CTA) and
 * shows only what its plan names:
 *
 *   team_rollout  one TeamRolloutBox right after the fix section: the reader
 *                 has to ask an admin, or is the admin. Public workshop seats,
 *                 the company cohort, the Guardrails Pack and a "forward this
 *                 to your admin" email. Clicks fire offer_click.
 *   single        one softer offer for an individual-user problem: the
 *                 Guardrails Pack banner (claude_pack) or the newsletter card.
 *
 * Why (Search Console and GA4, 28 days to 25-27 Nov 2026): these four posts
 * bring ~830 organic sessions per 28 days, but 15 of 1,096 pageviews reached a
 * team or guardrails offer while each page carried about seven CTAs. Only the
 * two org-policy posts have readers who depend on an admin.
 *
 * Prices and dates live in src/data/claudeCodeTeams.ts. Posts not listed here
 * keep the default stack (blogConsultingCtas.ts and friends).
 */

export interface TeamRolloutPlan {
  kind: "team_rollout";
  /**
   * id of the H2 that holds the fix. The box goes right before the next H2;
   * without JS it stays at the end of the article.
   */
  afterSection: string;
  headline: string;
  body: string;
  /** Subject and opening of the "forward this to your admin" email; the page URL is appended. */
  adminSubject: string;
  adminBody: string;
}

export interface SingleOfferPlan {
  kind: "single";
  offer: "claude_pack" | "newsletter";
}

export type PostCtaPlan = TeamRolloutPlan | SingleOfferPlan;

const TEAM_BODY =
  "Org-policy errors come back until the team has one rollout plan: one way to sign in, managed settings, guardrails, and rules for MCP servers. Here is how I can help you get there.";

export const postCtaPlans: Record<string, PostCtaPlan> = {
  "claude-code-remote-control-enable-2026": {
    kind: "team_rollout",
    afterSection: "how-an-admin-enables-it",
    headline: "Waiting on your admin to switch this on? Or are you the admin?",
    body: TEAM_BODY,
    adminSubject: "Can we enable Claude Code Remote Control?",
    adminBody:
      "Hi,\n\nClaude Code says \"Remote Control is disabled by your organization's policy\" when I try to continue a session from my phone or the browser. An organization owner can turn it on in claude.ai/admin-settings/claude-code (Remote Control toggle). This page explains the steps and the MDM override that can still block it:",
  },

  "fix-claude-code-subscription-disabled-copilot-credit-limit": {
    kind: "team_rollout",
    afterSection: "fix-claude-code-subscription-access-disabled",
    headline: "Only an admin can lift this block. Are you asking one, or are you the one?",
    body: TEAM_BODY,
    adminSubject: "Claude Code: please enable subscription access (or give me an API key)",
    adminBody:
      "Hi,\n\nClaude Code returns \"Your organization has disabled Claude subscription access for Claude Code.\" Could you enable Claude Code subscription access for our organization, or invite me to the Claude Console so I can use an API key? This page explains the options:",
  },

  // Individual-user problems: one softer offer each.
  "claude-code-econnreset-fix": { kind: "single", offer: "claude_pack" },
  "codex-device-code-auth-chatgpt-security-2026": { kind: "single", offer: "newsletter" },
};

export function getPostCtaPlan(slug: string): PostCtaPlan | undefined {
  return postCtaPlans[slug];
}
