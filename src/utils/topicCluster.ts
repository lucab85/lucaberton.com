/**
 * Canonical topic_cluster slugs for analytics (GA4) — every conversion event
 * carries one so funnels can be compared per content cluster instead of per
 * page. First match wins, so order clusters from most to least specific.
 */
interface ClusterRule {
  cluster: string;
  keywords: string[];
}

const clusterRules: ClusterRule[] = [
  { cluster: 'claude_code', keywords: ['claude', 'claude-code', 'claude code', 'anthropic'] },
  { cluster: 'self_hosted_agents', keywords: ['hermes', 'openclaw', 'hermes agent', 'self-hosted', 'oracle cloud'] },
  { cluster: 'openshift_ai', keywords: ['openshift', 'openshift-ai', 'rhel-ai', 'instructlab'] },
  { cluster: 'gpu_kubernetes', keywords: ['gpu', 'nvidia', 'mig', 'sriov', 'vllm', 'inference', 'model serving'] },
  { cluster: 'mlops_governance', keywords: ['mlops', 'governance', 'compliance', 'soc2', 'iso27001', 'ai governance'] },
  { cluster: 'agentic_ai', keywords: ['agentic', 'mcp', 'a2a', 'ai agents', 'agent', 'llm', 'rag'] },
  { cluster: 'ansible_automation', keywords: ['ansible', 'playbook', 'automation', 'aap'] },
  { cluster: 'kubernetes_devops', keywords: ['kubernetes', 'k8s', 'docker', 'container', 'helm', 'terraform', 'cicd', 'devops', 'cloud-native', 'observability'] },
  { cluster: 'certification', keywords: ['certification', 'exam', 'rhce', 'cka', 'voucher'] },
  { cluster: 'linux_sysadmin', keywords: ['rhel', 'linux', 'fedora', 'centos', 'bash', 'vim'] },
  { cluster: 'cloud_infrastructure', keywords: ['aws', 'azure', 'gcp', 'cloud', 'infrastructure', 'networking'] },
  { cluster: 'risc_v', keywords: ['risc-v', 'riscv'] },
  { cluster: 'ai_general', keywords: ['ai', 'ml', 'machine learning', 'deep-learning'] },
];

const MIN_SUBSTRING_LENGTH = 4;
function tokensMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const [longer, shorter] = a.length >= b.length ? [a, b] : [b, a];
  return shorter.length >= MIN_SUBSTRING_LENGTH && longer.includes(shorter);
}

/** Returns the canonical topic_cluster slug for a post's category + tags. */
export function topicCluster(category: string, tags: string[] = []): string {
  const terms = [category, ...tags].filter(Boolean).map((t) => t.toLowerCase());
  for (const rule of clusterRules) {
    if (rule.keywords.some((k) => terms.some((t) => tokensMatch(t, k)))) {
      return rule.cluster;
    }
  }
  return 'general';
}
