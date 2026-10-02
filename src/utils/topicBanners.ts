/**
 * Site-wide announcement banner, chosen by the page's topic cluster
 * (src/utils/topicCluster.ts) so the most valuable strip on the page offers
 * the reader's next step instead of one global promotion. Order of priority:
 * consulting (engineering leaders) > newsletter (engineers) > own courses.
 *
 * Tracking attributes use the quoted data-* keys ConversionTracker reads, so
 * scripts/validate-analytics.cjs checks their values statically.
 */
export interface TopicBanner {
  emoji: string;
  headline: string;
  description?: string;
  linkText: string;
  linkUrl: string;
  external: boolean;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  trackingAttrs?: Record<string, string>;
}

const MASTERCLASS: TopicBanner = {
  emoji: '🎓',
  headline: 'Claude Code Masterclass',
  description: 'Learn AI-assisted development on Udemy — plus the companion book on Leanpub & Amazon.',
  linkText: 'Start Learning',
  linkUrl: 'https://www.udemy.com/course/claude-code-masterclass-ai-coding/',
  external: true,
  gradientFrom: 'indigo-600',
  gradientVia: 'purple-600',
  gradientTo: 'pink-600',
};

const AGENT_PLATFORM: TopicBanner = {
  emoji: '🤖',
  headline: 'Running agents for a team, not just yourself?',
  description: 'Get an independent review of identity, secrets, failover, observability and governance.',
  linkText: 'Assess your agent platform',
  linkUrl: '/production-ai-assessment/',
  external: false,
  gradientFrom: 'cyan-600',
  gradientVia: 'blue-600',
  gradientTo: 'purple-600',
  trackingAttrs: {
    'data-track-event': 'consulting_cta_click',
    'data-tp-target-offer': 'agent_platform_assessment',
    'data-tp-cta-position': 'top_banner',
    'data-tp-cta-variant': 'banner_agent_platform',
  },
};

const PRODUCTION_AI: TopicBanner = {
  emoji: '🚀',
  headline: 'Taking AI from prototype to production?',
  description: 'Find the architecture, GPU, security and governance gaps before they become incidents.',
  linkText: 'Get a Production AI Readiness Assessment',
  linkUrl: '/production-ai-assessment/',
  external: false,
  gradientFrom: 'cyan-600',
  gradientVia: 'blue-600',
  gradientTo: 'purple-600',
  trackingAttrs: {
    'data-track-event': 'consulting_cta_click',
    'data-tp-target-offer': 'production_ai_assessment',
    'data-tp-cta-position': 'top_banner',
    'data-tp-cta-variant': 'banner_production_ai',
  },
};

const CLOUD_PLATFORM: TopicBanner = {
  emoji: '☁️',
  headline: 'Standardizing cloud access across an engineering organization?',
  description: 'SSO, roles, account boundaries and onboarding, designed before they become security debt.',
  linkText: 'Review your cloud platform',
  linkUrl: '/services/cloud-infrastructure/',
  external: false,
  gradientFrom: 'emerald-600',
  gradientVia: 'teal-600',
  gradientTo: 'cyan-600',
  trackingAttrs: {
    'data-track-event': 'consulting_cta_click',
    'data-tp-target-offer': 'cloud_platform_assessment',
    'data-tp-cta-position': 'top_banner',
    'data-tp-cta-variant': 'banner_cloud_platform',
  },
};

const NEWSLETTER: TopicBanner = {
  emoji: '📬',
  headline: 'Get weekly Production AI insights',
  description: 'Practical notes on Kubernetes, AI infrastructure and platform engineering. No spam.',
  linkText: 'Subscribe free',
  linkUrl: 'https://luca-berton.kit.com/ce74a48bfa',
  external: true,
  gradientFrom: 'indigo-600',
  gradientVia: 'purple-600',
  gradientTo: 'pink-600',
  trackingAttrs: {
    'data-track-event': 'email_signup_start',
    'data-tp-form-id': 'kit_ce74a48bfa',
    'data-tp-cta-position': 'top_banner',
    'data-tp-cta-variant': 'banner_newsletter',
  },
};

const BY_CLUSTER: Record<string, TopicBanner> = {
  claude_code: MASTERCLASS,
  self_hosted_agents: AGENT_PLATFORM,
  agentic_ai: AGENT_PLATFORM,
  openshift_ai: PRODUCTION_AI,
  gpu_kubernetes: PRODUCTION_AI,
  mlops_governance: PRODUCTION_AI,
  ai_general: PRODUCTION_AI,
  cloud_infrastructure: CLOUD_PLATFORM,
};

/** Banner for a page: blog posts pass their cluster; other pages keep the Masterclass. */
export function bannerFor(cluster?: string): TopicBanner {
  if (!cluster) return MASTERCLASS;
  return BY_CLUSTER[cluster] ?? NEWSLETTER;
}
