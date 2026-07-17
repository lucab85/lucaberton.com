/**
 * Canonical keyword -> service/pillar-page lookup, used to auto-suggest the
 * most relevant service for a given blog post's category/tags. Shared by
 * RelatedServices.astro (link cards) and BlogConsultationCta.astro (the CTA
 * headline + link). Keep this the single source of truth rather than
 * duplicating the list.
 */
export interface ServiceMatch {
  keywords: string[];
  title: string;
  description: string;
  url: string;
  icon: string;
}

export const serviceMatches: ServiceMatch[] = [
  {
    keywords: ['ai', 'ml', 'gpu', 'llm', 'rag', 'instructlab', 'rhel-ai', 'openshift-ai', 'mlops', 'deep-learning', 'fine-tuning', 'inference'],
    title: 'AI Integration & GPU Platforms',
    description: 'Need help deploying AI/ML platforms? Get expert consulting on OpenShift AI, GPU orchestration, and MLOps.',
    url: '/services/ai-integration/',
    icon: '🧠',
  },
  {
    keywords: ['kubernetes', 'kubectl', 'k8s', 'docker', 'container', 'openshift', 'helm', 'microservices', 'cloud-native'],
    title: 'Kubernetes & Containerization',
    description: 'Master Kubernetes and container orchestration with hands-on workshops and architecture consulting.',
    url: '/services/kubernetes-workshops/',
    icon: '☸️',
  },
  {
    keywords: ['ansible', 'python', 'automation', 'playbook', 'terraform'],
    title: 'Ansible & Python Training',
    description: 'Level up your automation skills with expert-led Ansible and Python training.',
    url: '/services/ansible-python-training/',
    icon: '🐍',
  },
  {
    keywords: ['cloud', 'aws', 'azure', 'gcp', 'infrastructure', 'networking', 'security', 'cloud-security'],
    title: 'Cloud Infrastructure Design',
    description: 'Build resilient, cost-effective cloud environments with expert architecture consulting.',
    url: '/services/cloud-infrastructure/',
    icon: '☁️',
  },
  {
    keywords: ['strategy', 'platform-engineering', 'finops', 'governance', 'soc2', 'iso27001', 'compliance'],
    title: 'Automation Strategy Consulting',
    description: 'Streamline workflows and build automation strategies that scale.',
    url: '/services/automation-strategy/',
    icon: '⚙️',
  },
  // Pillar/guide pages — deeper reference reads than the service pages above.
  // Kept after the service entries so ties in scoring favor the service pages
  // (stable sort preserves insertion order); these only win outright for
  // posts that match their narrower, more specific keyword sets.
  {
    keywords: ['ai', 'governance', 'soc2', 'iso27001', 'mlops', 'openshift-ai', 'compliance', 'security'],
    title: 'AI Infrastructure for Regulated Enterprises',
    description: 'Reference architecture and SOC 2/ISO 27001 control mapping for AI in finance, healthcare, and public sector.',
    url: '/ai-infrastructure-consultant-regulated-enterprises/',
    icon: '🏛️',
  },
  {
    keywords: ['openshift-ai', 'gpu', 'nvidia', 'mlops', 'kubernetes', 'inference'],
    title: 'OpenShift AI Multi-Tenant GPU Architecture',
    description: 'MIG vs time-slicing vs full-GPU passthrough, isolation, scheduling, and chargeback.',
    url: '/openshift-ai-multi-tenant-gpu-architecture/',
    icon: '🎛️',
  },
  {
    keywords: ['ai', 'mlops', 'governance', 'strategy', 'platform-engineering'],
    title: 'AI Readiness Assessment',
    description: 'What gets evaluated, how scoring works, and what a 30/60/90-day roadmap looks like.',
    url: '/ai-readiness-assessment/',
    icon: '📋',
  },
  {
    keywords: ['mlops', 'governance', 'soc2', 'iso27001', 'ai', 'compliance'],
    title: 'Enterprise MLOps Governance',
    description: 'Model registry, approval workflow, risk classification, and audit-ready evidence.',
    url: '/enterprise-mlops-governance/',
    icon: '🔏',
  },
  {
    keywords: ['gpu', 'cost-optimization', 'finops', 'mlops', 'inference', 'kubernetes'],
    title: 'GPU Cost Optimization',
    description: 'Where GPU spend goes, the main cost levers, and how to model cost per request.',
    url: '/gpu-cost-optimization/',
    icon: '💸',
  },
];

export interface ScoredServiceMatch extends ServiceMatch {
  score: number;
}

// Guards against e.g. keyword "ai" false-matching inside an unrelated tag
// like "Book Fair" (which contains the substring "ai") — substring matching
// is only safe once the shorter side is long enough to be a real signal.
const MIN_SUBSTRING_LENGTH = 4;
function tokensMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const [longer, shorter] = a.length >= b.length ? [a, b] : [b, a];
  return shorter.length >= MIN_SUBSTRING_LENGTH && longer.includes(shorter);
}

/** Scores every entry against a post's category+tags, returns the top `limit` with score > 0. */
export function matchServices(category: string, tags: string[], limit = 2): ScoredServiceMatch[] {
  const allTags = [category.toLowerCase(), ...tags.map((t) => t.toLowerCase())];
  return serviceMatches
    .map((s) => ({
      ...s,
      score: s.keywords.filter((k) => allTags.some((t) => tokensMatch(t, k))).length,
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
