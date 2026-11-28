/**
 * Claude Code for Teams: the public one-day workshop and the company cohort.
 * Both are sold by Open Empower; the dated, priced page is
 * https://www.openempower.com/workshops/claude-code-for-teams.
 *
 * One source for every price and date on lucaberton.com: the team-rollout box
 * on the org-policy error posts (TeamRolloutBox.astro, src/utils/postCtaPlans.ts)
 * and /claude-code-for-teams/. Change a price or a date here only, and keep it
 * the same as the Open Empower page.
 */

export const claudeCodeTeams = {
  workshopUrl: "https://www.openempower.com/workshops/claude-code-for-teams",
  bookCallUrl: "https://www.openempower.com/book-a-call",
  seatPrice: "€490",
  cohortPrice: "€4,500",
  cohortSize: 10,
  /**
   * Claude Code Team Kit (guardrail hooks, managed-settings guide, CLAUDE.md
   * templates, skills): Individual €29, Team €149. Its page is internal, so
   * links carry no UTMs. Sold through the kit page, not Gumroad.
   */
  teamKit: { name: "Claude Code Team Kit", page: "/claude-code-team-kit/", fromPrice: "€29" },
  /** Public session dates (YYYY-MM-DD). Past dates drop out at build time. */
  sessions: ["2026-12-11", "2027-01-20"],
};

/** UTM campaign on every outbound Claude Code for Teams link. */
export const TEAMS_UTM_CAMPAIGN = "claude-code-teams";

/**
 * Adds the group's referral UTMs to an outbound link. `content` names the page
 * the click came from (the post slug), so openempower.com's analytics show
 * which article sold the seat.
 */
export function withTeamsUtm(url: string, content: string): string {
  const u = new URL(url);
  u.searchParams.set("utm_source", "lucaberton.com");
  u.searchParams.set("utm_medium", "referral");
  u.searchParams.set("utm_campaign", TEAMS_UTM_CAMPAIGN);
  u.searchParams.set("utm_content", content);
  return u.toString();
}

/** Upcoming public sessions, formatted "11 December 2026". */
export function upcomingSessions(now: Date = new Date()): string[] {
  const today = now.toISOString().slice(0, 10);
  return claudeCodeTeams.sessions
    .filter((d) => d >= today)
    .map((d) =>
      new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
    );
}

/** "11 December 2026 and 20 January 2027" (or one date, or null when none are left). */
export function upcomingSessionsText(now: Date = new Date()): string | null {
  const dates = upcomingSessions(now);
  if (dates.length === 0) return null;
  if (dates.length === 1) return dates[0];
  return `${dates.slice(0, -1).join(", ")} and ${dates[dates.length - 1]}`;
}
