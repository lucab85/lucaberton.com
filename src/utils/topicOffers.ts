/**
 * Topic offers: the default end-of-post offer for whole topics, chosen from a
 * post's slug, category and tags. A post that matches shows one TopicOfferBox
 * at the end of the article (at most two offers) and drops the generic stack
 * (topic and sponsored banners, doctor strip, Gumroad product banner and
 * cards, newsletter, book and course cards, service cards, closing consulting
 * and bootcamp CTAs, sticky bar). Posts with an explicit plan in
 * postCtaPlans.ts are handled there first.
 *
 *   ai_coding     Claude Code, Codex, Copilot, Cursor and other AI coding posts
 *                 → "Claude Code Masterclass" ebook (Leanpub)
 *   gpu_ai_infra  GPU and AI-infrastructure posts
 *                 → GPU cluster design review + "Kubernetes AI" ebook
 *   aap           Ansible Automation Platform posts
 *                 → AAP 2.6 Upgrade Review + "Ansible AWX By Examples" ebook
 *   ansible       other Ansible posts → the matching ebook: AWX, containers
 *                 and Kubernetes, RHEL, or "Ansible by Examples"
 *   rhel          RHEL / Red Hat posts → "Red Hat Enterprise Linux 10 Handbook"
 *
 * Why (Nov 2026): the Leanpub ebooks are the best-selling self-serve product
 * (41 sales in 90 days, Claude Code Masterclass 26 of them), while Gumroad
 * payouts are paused, so Gumroad products no longer lead. No Leanpub prices
 * are shown (Leanpub sets them).
 *
 * Every link fires offer_click (offer, placement). External links carry
 * utm_source=lucaberton.com&utm_medium=referral&utm_campaign=<campaign>&utm_content=<post slug>.
 * The GPU review page is on this site, so it carries no UTMs (internal UTMs
 * would start a new GA4 session); offer_click still records the click.
 */
import { topicCluster } from "./topicCluster";

export type OfferId =
  | "leanpub_claude_code"
  | "leanpub_kubernetes_ai"
  | "leanpub_ansible_awx"
  | "leanpub_ansible_kubernetes"
  | "leanpub_rhel10"
  | "leanpub_ansible_examples"
  | "gpu_cluster_review"
  | "aap_upgrade_review";

export interface TopicOffer {
  id: OfferId;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
  /** utm_campaign for external links; omitted for pages on this site. */
  utmCampaign?: string;
}

const ebook = (slug: string, title: string, body: string, id: OfferId): TopicOffer => ({
  id,
  eyebrow: "Ebook by Luca Berton",
  title,
  body,
  ctaLabel: "Get the ebook on Leanpub →",
  href: `https://leanpub.com/${slug}`,
  utmCampaign: `leanpub-${slug}`,
});

export const OFFERS: Record<OfferId, TopicOffer> = {
  leanpub_claude_code: ebook(
    "claude-code",
    "Claude Code Masterclass",
    "A hands-on companion for AI-assisted coding with Claude Code: testing, Git workflows, refactoring and production readiness.",
    "leanpub_claude_code",
  ),
  leanpub_kubernetes_ai: ebook(
    "kubernetes-ai",
    "Kubernetes AI",
    "Running LLMs and GPU workloads on Kubernetes: inference, training, NVIDIA GPUs, storage, networking, security and operations.",
    "leanpub_kubernetes_ai",
  ),
  leanpub_ansible_awx: ebook(
    "ansible-awx-by-examples",
    "Ansible AWX By Examples",
    "AWX and the automation controller, step by step, with real examples.",
    "leanpub_ansible_awx",
  ),
  leanpub_ansible_kubernetes: ebook(
    "ansible-for-kubernetes-by-examples",
    "Ansible For Containers and Kubernetes By Examples",
    "Automate day-to-day operations on containers, Kubernetes and OpenShift with Ansible, with real-life examples.",
    "leanpub_ansible_kubernetes",
  ),
  leanpub_rhel10: ebook(
    "red-hat-enterprise-linux-10",
    "Red Hat Enterprise Linux 10 Handbook",
    "Installation, system management, security, performance tuning, automation with System Roles and cloud on RHEL 10.",
    "leanpub_rhel10",
  ),
  leanpub_ansible_examples: ebook(
    "ansiblebyexamples",
    "Ansible by Examples",
    "Learn Ansible playbooks from scratch and automate day-to-day Linux and Windows administration.",
    "leanpub_ansible_examples",
  ),
  gpu_cluster_review: {
    id: "gpu_cluster_review",
    eyebrow: "Fixed fee · EUR 10,000",
    title: "GPU cluster design review",
    body: "An independent review of your GPU cluster design (fabric, management plane and operations) before you place a non-cancellable hardware order.",
    ctaLabel: "See the review →",
    href: "/services/gpu-cluster-review/",
  },
  aap_upgrade_review: {
    id: "aap_upgrade_review",
    eyebrow: "Fixed fee · €2,900",
    title: "AAP 2.6 Upgrade Review",
    body: "Upgrade review and guided migration to AAP 2.6: RHEL 8 to 9, RPM to containerized, AWX and Tower to AAP, by a former Red Hat Ansible engineer.",
    ctaLabel: "See the upgrade review →",
    href: "https://www.openempower.com/services/ansible-automation-platform-migration",
    utmCampaign: "aap-review",
  },
};

export type Topic = "ai_coding" | "gpu_ai_infra" | "aap" | "ansible" | "rhel";

export interface TopicMatch {
  topic: Topic;
  offers: OfferId[];
}

/** Heading of the end-of-post box, per topic. */
export const TOPIC_HEADLINES: Record<Topic, string> = {
  ai_coding: "Go further with Claude Code",
  gpu_ai_infra: "Planning or running a GPU platform?",
  aap: "Upgrading to AAP 2.6?",
  ansible: "Keep going with Ansible",
  rhel: "Go deeper on RHEL",
};

// "copilot" alone is ambiguous (Microsoft 365 Copilot is not a coding tool):
// only GitHub Copilot, Copilot Pro/CLI, or a bare "copilot" tag count.
const AI_CODING = /\b(claude|codex|github copilot|copilot (pro|cli|agent)|cursor|windsurf|aider|cline|kiro|opencode|gemini cli|ai coding|ai assisted (coding|development)|coding agents?|vibe ?coding)\b/;
const COPILOT_TAG = /(^|\| )copilot( \||$)/;
const GPU_TERMS = /\b(gpu|gpus|nvidia|cuda|mig|vllm|kserve|triton|dcgm|instructlab|rhel ai|openshift ai|ai infrastructure|model serving|inference)\b/;
const ANSIBLE = /\b(ansible|aap|awx)\b/;
const AAP = /\b(aap|ansible automation platform|automation controller|ansible tower|tower|automation hub|event driven ansible)\b/;
const AWX = /\bawx\b/;
const K8S = /\b(kubernetes|k8s|openshift|containers?|podman|docker|helm)\b/;
const RHEL = /\b(rhel|rhel \d+|red hat enterprise linux|red hat|redhat)\b/;

/** Topic offer for a post, or null when no topic applies (the default stack stays). */
export function topicOfferFor(slug: string, category: string, tags: string[] = []): TopicMatch | null {
  const text = [slug, category, ...tags]
    .filter(Boolean)
    .map((t) => t.toLowerCase().replace(/[-_/]+/g, " "))
    .join(" | ");
  const cluster = topicCluster(category, tags);

  if (cluster === "claude_code" || AI_CODING.test(text) || COPILOT_TAG.test(text)) {
    return { topic: "ai_coding", offers: ["leanpub_claude_code"] };
  }
  if (cluster === "gpu_kubernetes" || (cluster !== "ansible_automation" && GPU_TERMS.test(text))) {
    return { topic: "gpu_ai_infra", offers: ["gpu_cluster_review", "leanpub_kubernetes_ai"] };
  }
  if (ANSIBLE.test(text)) {
    if (AAP.test(text)) return { topic: "aap", offers: ["aap_upgrade_review", "leanpub_ansible_awx"] };
    if (AWX.test(text)) return { topic: "ansible", offers: ["leanpub_ansible_awx"] };
    if (K8S.test(text)) return { topic: "ansible", offers: ["leanpub_ansible_kubernetes"] };
    if (RHEL.test(text)) return { topic: "ansible", offers: ["leanpub_rhel10"] };
    return { topic: "ansible", offers: ["leanpub_ansible_examples"] };
  }
  if (RHEL.test(text)) {
    return { topic: "rhel", offers: ["leanpub_rhel10"] };
  }
  return null;
}

/** Offer link with the referral UTMs (external links only). */
export function offerHref(offer: TopicOffer, postSlug: string): string {
  if (!offer.utmCampaign || !/^https?:\/\//.test(offer.href)) return offer.href;
  const u = new URL(offer.href);
  u.searchParams.set("utm_source", "lucaberton.com");
  u.searchParams.set("utm_medium", "referral");
  u.searchParams.set("utm_campaign", offer.utmCampaign);
  u.searchParams.set("utm_content", postSlug);
  return u.toString();
}
