export interface BlogConsultingOffer {
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  targetOffer: string;
  ctaVariant: string;
  benefits?: string[];
  /**
   * Quiet secondary link. Without it the card falls back to the
   * serviceMatches.ts service, which is "AI Integration & GPU Platforms" for
   * most AI posts — off-topic for Claude Code / agent readers.
   */
  secondaryLabel?: string;
  secondaryHref?: string;
}

/**
 * Explicit enterprise-conversion overrides for the highest-value organic
 * landing pages. Keep this list intentionally small: broad topic matching
 * remains in serviceMatches.ts, while these messages bridge a specific
 * technical problem to an organization-level assessment.
 */
export const blogConsultingCtas: Record<string, BlogConsultingOffer> = {
  'claude-code-econnreset-fix': {
    headline: 'Seeing this across multiple developers?',
    body:
      'Repeated failures across managed laptops, VPNs, proxies, or corporate networks are usually an environment-design problem, not a one-machine problem.',
    ctaLabel: 'Assess Your AI Developer Platform →',
    ctaHref: '/production-ai-assessment/',
    targetOffer: 'ai_developer_platform_assessment',
    ctaVariant: 'corporate_network_problem',
    benefits: ['Network', 'Identity', 'Security', 'Developer access'],
    secondaryLabel: 'See AI & cloud advisory services',
    secondaryHref: '/services/',
  },

  'fix-claude-code-subscription-disabled-copilot-credit-limit': {
    headline: 'Managing AI coding tools across an engineering team?',
    body:
      'Licensing, access policy, cost control, and developer permissions quickly become a governance problem at scale.',
    ctaLabel: 'Review Your AI Platform Readiness →',
    ctaHref: '/ai-readiness-assessment/',
    targetOffer: 'ai_readiness_assessment',
    ctaVariant: 'team_tooling_governance',
    benefits: ['Licensing', 'Access', 'Governance', 'Cost'],
    secondaryLabel: 'Explore enterprise services',
    secondaryHref: '/services/',
  },

  'hermes-agent-troubleshooting': {
    headline: 'One agent is easy. Operating agents reliably is the hard part.',
    body:
      'Production agents introduce provider failover, secrets, observability, permissions, and operational reliability.',
    ctaLabel: 'Assess Your Agent Platform →',
    ctaHref: '/production-ai-assessment/',
    targetOffer: 'agent_platform_assessment',
    ctaVariant: 'agent_reliability_problem',
    benefits: ['Reliability', 'Secrets', 'Observability', 'Failover'],
    secondaryLabel: 'See AI platform services',
    secondaryHref: '/services/',
  },

  'hermes-agent-oracle-cloud-free-tier-deployment': {
    headline: 'Prototype working? Before you call it production…',
    body:
      'A running VM is only the first step. Production AI needs identity, monitoring, resilience, governance, and cost controls.',
    ctaLabel: 'Assess Your Production Architecture →',
    ctaHref: '/production-ai-assessment/',
    targetOffer: 'agent_platform_assessment',
    ctaVariant: 'prototype_to_production',
    benefits: ['Architecture', 'Security', 'Monitoring', 'Resilience'],
    secondaryLabel: 'See production AI services',
    secondaryHref: '/services/',
  },

  'karpathy-claude-md-llm-coding-principles-2026': {
    headline: 'A CLAUDE.md works for one repo. What governs 500?',
    body:
      'Scaling AI coding across an organization requires company, team, and repository-level standards plus security and tool-access controls.',
    ctaLabel: 'Review Your AI Coding Governance →',
    ctaHref: '/ai-readiness-assessment/',
    targetOffer: 'ai_developer_governance',
    ctaVariant: 'repo_to_org_governance',
    benefits: ['Policy', 'MCP access', 'Security', 'Review gates'],
    secondaryLabel: 'Explore advisory services',
    secondaryHref: '/services/',
  },

  'claude-code-remote-control-enable-2026': {
    headline: 'Rolling Claude Code out across managed devices?',
    body:
      'When deployment depends on identity, MDM, retention, and network controls, configuration becomes platform architecture.',
    ctaLabel: 'Review Your Enterprise AI Setup →',
    ctaHref: '/production-ai-assessment/',
    targetOffer: 'enterprise_claude_code_review',
    ctaVariant: 'managed_device_rollout',
    benefits: ['Identity', 'MDM', 'Network', 'Governance'],
    secondaryLabel: 'See enterprise AI services',
    secondaryHref: '/services/',
  },

  'agntcon-mcpcon-europe-2026-media-partner': {
    headline: 'Planning production agents inside your organization?',
    body:
      'Agent identity, MCP governance, permissions, observability, and reliability become platform concerns at production scale.',
    ctaLabel: 'Assess Your Agent Platform Readiness →',
    ctaHref: '/production-ai-assessment/',
    targetOffer: 'agent_platform_readiness',
    ctaVariant: 'europe_agent_readiness',
    benefits: ['MCP', 'Identity', 'Observability', 'Governance'],
    secondaryLabel: 'See AI platform advisory services',
    secondaryHref: '/services/',
  },

  'claude-code-uiux-pro-max-website-builder': {
    headline: 'What happens when 50 developers start building this way?',
    body:
      'At team scale, AI-assisted development becomes a standards, security, review, and delivery-governance problem.',
    ctaLabel: 'Assess Your AI Development Workflow →',
    ctaHref: '/ai-readiness-assessment/',
    targetOffer: 'ai_software_delivery_assessment',
    ctaVariant: 'developer_to_team_scale',
    benefits: ['Standards', 'Security', 'Review', 'Delivery'],
    secondaryLabel: 'Explore AI engineering services',
    secondaryHref: '/services/',
  },

  'connecting-hermes-agent-to-discord': {
    headline: 'A Discord bot is simple. Agent authorization is not.',
    body:
      'Once agents can reach internal tools and systems, identity, permissions, secrets, and trust boundaries become architecture concerns.',
    ctaLabel: 'Review Your Agent Access Model →',
    ctaHref: '/ai-readiness-assessment/',
    targetOffer: 'agent_identity_governance_review',
    ctaVariant: 'agent_permissions_boundary',
    benefits: ['Identity', 'Permissions', 'Secrets', 'Trust boundaries'],
    secondaryLabel: 'See AI governance services',
    secondaryHref: '/services/',
  },

  'install-aws-cli-mac-homebrew-2026': {
    headline: 'Standardizing AWS access across an engineering organization?',
    body:
      'SSO, IAM roles, onboarding, account boundaries, and developer access should be designed before inconsistencies become security debt.',
    ctaLabel: 'Review Your Cloud Platform →',
    ctaHref: '/production-ai-assessment/',
    targetOffer: 'cloud_platform_assessment',
    ctaVariant: 'aws_access_standardization',
    benefits: ['SSO', 'IAM', 'Roles', 'Developer access'],
    secondaryLabel: 'Explore cloud infrastructure services',
    secondaryHref: '/services/cloud-infrastructure/',
  },
};

export function getBlogConsultingCta(slug: string): BlogConsultingOffer | undefined {
  return blogConsultingCtas[slug];
}
