/**
 * Every book lucaberton.com shows: the published books (Packt, Apress, BPB)
 * and the Leanpub ebooks. One source for /books/, the home-page books section,
 * the end-of-post ebook offers (BookCard via TopicOfferBox / TeamRolloutBox)
 * and MasterclassFeature.
 *
 * Covers live in src/assets/books/ (published books) and
 * src/assets/books/leanpub/ (400px WebP from Leanpub); Astro resizes them at
 * build time, nothing is hotlinked. Blurbs come from the existing book list
 * or from the book's Leanpub page. Do not add prices, ratings or claims here.
 *
 * Purchase links keep their destinations; Leanpub links go through
 * leanpubUrl() (src/utils/leanpub.ts), which adds the full-price "lucaberton"
 * coupon where this site has one (Claude Code Masterclass, Ansible Automation
 * Platform By Example).
 *
 * Retired on Leanpub (Nov 2026), so not listed as ebooks: "Ansible for
 * Containers and Kubernetes By Examples" and "Ansible for VMware By Examples".
 * The Apress editions ("Ansible for Kubernetes by Example", "Ansible for
 * VMware by Examples") stay, with their Amazon links.
 */
import type { ImageMetadata } from "astro";
import { leanpubTeamUrl, leanpubUrl } from "../utils/leanpub";

import claudeCodeProjects from "../assets/books/claude-code-projects.jpg";
import claudeCodeMasterclass from "../assets/books/claude-code-masterclass.jpg";
import practicalRhelAi from "../assets/books/practical_RHEL_AI-large.jpg";
import kubernetesRecipes from "../assets/books/KubernetesReceipes.webp";
import rhel9SysAdmins from "../assets/books/9365891175-large.jpg";
import rhce from "../assets/books/RHCE-large.jpg";
import redHatAnsibleAutomation from "../assets/books/9355518994-large.jpg";
import handsOnAnsible from "../assets/books/9789355515599-large.jpg";
import ansibleForKubernetesApress from "../assets/books/9781484292853-large.jpg";
import ansibleForVmwareApress from "../assets/books/9781484288795-large.jpg";
import learnAnsible from "../assets/books/LearnAnsible-large.jpg";

import kubernetesAi from "../assets/books/leanpub/kubernetes-ai.webp";
import openshiftAi from "../assets/books/leanpub/openshift-ai.webp";
import rhel10 from "../assets/books/leanpub/red-hat-enterprise-linux-10.webp";
import terraformByExample from "../assets/books/leanpub/terraform-by-example.webp";
import ansibleByExamples from "../assets/books/leanpub/ansiblebyexamples.webp";
import ansibleAutomationPlatform from "../assets/books/leanpub/ansible-automation-platform.webp";
import ansibleAwx from "../assets/books/leanpub/ansible-awx-by-examples.webp";
import ansibleForAws from "../assets/books/leanpub/ansible-for-aws-by-examples.webp";
import ansibleForWindows from "../assets/books/leanpub/ansibleforwindowsbyexamples.webp";
import ansibleForPostgresql from "../assets/books/leanpub/ansible-for-postgresql-by-examples.webp";
import ansibleForSecurity from "../assets/books/leanpub/ansibleforsecuritybyexamples.webp";
import masteringAnsible from "../assets/books/leanpub/mastering-ansible.webp";
import ansibleUsersGroups from "../assets/books/leanpub/ansiblelinuxusersandgroupsbyexamples.webp";
import ansibleFilesystem from "../assets/books/leanpub/linuxfileanddirectorybyansibleexamples.webp";
import ansibleForLinux from "../assets/books/leanpub/ansibleforlinuxbyexamples.webp";
import aiThatScales from "../assets/books/leanpub/ai-that-scales.webp";
import agenticAi from "../assets/books/leanpub/agentic-ai.webp";
import aiTransformation from "../assets/books/leanpub/ai-transformation.webp";
import ansibleCookbook from "../assets/books/leanpub/ansible-cookbook.webp";
import ansibleTipsAndTricks from "../assets/books/leanpub/ansible-tips-and-tricks.webp";
import azureDevTestLabs from "../assets/books/leanpub/azure-devtest-labs-handbook.webp";

/** Shelf on /books/; also picks the card's tint. */
export type BookTopic = "ai" | "kubernetes" | "ansible" | "linux_cloud";

export const BOOK_TOPICS: { id: BookTopic; title: string; blurb: string }[] = [
  { id: "ai", title: "AI & Claude Code", blurb: "AI-assisted coding, agentic systems and enterprise AI." },
  { id: "kubernetes", title: "Kubernetes & OpenShift", blurb: "Containers, GPUs and AI platforms on Kubernetes and OpenShift." },
  { id: "ansible", title: "Ansible", blurb: "Automation by example, from first playbook to Automation Platform." },
  { id: "linux_cloud", title: "Linux & Cloud", blurb: "Red Hat Enterprise Linux, certification and cloud infrastructure." },
];

export interface Book {
  id: string;
  title: string;
  author: string;
  blurb: string;
  cover: ImageMetadata;
  topic: BookTopic;
  /** "ebook" = Leanpub ebook by Luca; "book" = published book. */
  format: "ebook" | "book";
  /** Publisher, only where the site already names it. */
  publisher?: string;
  leanpub?: string;
  amazon?: string;
  /** Page on this site about the book. */
  blogUrl?: string;
}

const LUCA = "Luca Berton";

/** Leanpub link (coupon path where this site has one) with the referral UTMs. */
const leanpub = (slug: string) =>
  leanpubUrl(slug, `utm_source=lucaberton.com&utm_medium=referral&utm_campaign=leanpub-${slug.toLowerCase()}&utm_content=books`);

const ebook = (id: string, title: string, blurb: string, cover: ImageMetadata, topic: BookTopic): Book => ({
  id,
  title,
  author: LUCA,
  blurb,
  cover,
  topic,
  format: "ebook",
  leanpub: leanpub(id),
});

/** In display order: the home page shows the first six. */
export const BOOKS: Book[] = [
  {
    id: "claude-code-projects",
    title: "Claude Code Projects",
    author: LUCA,
    blurb: "Build 10 real-world projects with Claude Code — Skills, hooks, MCP, testing, Git, and a capstone API shipped via pull request. My new Packt book, December 9, 2026.",
    cover: claudeCodeProjects,
    topic: "ai",
    format: "book",
    publisher: "Packt",
    amazon: "https://link.amazon/B04i9Q8Bt",
    blogUrl: "/blog/claude-code-projects-book-2026/",
  },
  {
    id: "claude-code",
    title: "Claude Code Masterclass",
    author: LUCA,
    blurb: "Build real-world software with Claude Code — a hands-on, project-based companion covering planning, testing, refactoring, and shipping with AI.",
    cover: claudeCodeMasterclass,
    topic: "ai",
    format: "ebook",
    leanpub: leanpubUrl("claude-code"), // full-price coupon that tags lucaberton.com sales
    amazon: "https://amzn.to/4vpWeSx",
  },
  {
    id: "practical-rhel-ai",
    title: "Practical RHEL AI",
    author: LUCA,
    blurb: "Designing, Deploying and Scaling AI Solutions with Red Hat Enterprise Linux.",
    cover: practicalRhelAi,
    topic: "ai",
    format: "book",
    publisher: "Apress",
    amazon: "https://amzn.to/4qjORdC",
    blogUrl: "/practical-rhel-ai/",
  },
  {
    id: "kubernetes-recipes",
    title: "Kubernetes Recipes",
    author: "Luca Berton & Grzegorz Stencel",
    blurb: "Practical Guide for Container Orchestration and Deployment.",
    cover: kubernetesRecipes,
    topic: "kubernetes",
    format: "book",
    publisher: "Apress",
    amazon: "https://amzn.to/3DzC8QA",
    blogUrl: "/kubernetes-recipes/",
  },
  {
    id: "rhel-9-for-sysadmins",
    title: "Red Hat Enterprise Linux 9 for SysAdmins",
    author: LUCA,
    blurb: "A technical guide for building secure production systems using RHEL 9 administration.",
    cover: rhel9SysAdmins,
    topic: "linux_cloud",
    format: "book",
    publisher: "BPB",
    amazon: "https://amzn.to/4hRsc3Z",
    blogUrl: "/blog/red-hat-enterprise-linux-9-for-sysadmins/",
  },
  {
    id: "rhce-exam",
    title: "Mastering the Red Hat Certified Engineer (RHCE) Exam",
    author: LUCA,
    blurb: "Your complete guide to Linux administration, automation, and certification.",
    cover: rhce,
    topic: "linux_cloud",
    format: "book",
    publisher: "BPB",
    amazon: "https://amzn.to/3ZOJ2IM",
    blogUrl: "/blog/mastering-the-red-hat-certified-engineer-rhce-exam/",
  },
  {
    id: "red-hat-ansible-automation",
    title: "Red Hat Ansible Automation",
    author: LUCA,
    blurb: "Deep dive into advanced Ansible techniques, covering complex playbooks, modules, and custom integrations.",
    cover: redHatAnsibleAutomation,
    topic: "ansible",
    format: "book",
    publisher: "BPB",
    amazon: "https://amzn.to/41K0cbm",
    blogUrl: "/blog/red-hat-ansible-automation/",
  },
  {
    id: "hands-on-ansible-automation",
    title: "Hands-on Ansible Automation",
    author: LUCA,
    blurb: "This book provides insights on managing hybrid cloud environments with Ansible, covering multi-cloud orchestration.",
    cover: handsOnAnsible,
    topic: "ansible",
    format: "book",
    publisher: "BPB",
    amazon: "https://amzn.to/43HEMuL",
    blogUrl: "/blog/hands-on-ansible-automation/",
  },
  {
    id: "ansible-for-kubernetes-by-example",
    title: "Ansible for Kubernetes by Example",
    author: LUCA,
    blurb: "Learn how to automate Kubernetes clusters with Ansible. Streamline your container orchestration processes.",
    cover: ansibleForKubernetesApress,
    topic: "ansible",
    format: "book",
    publisher: "Apress",
    amazon: "https://amzn.to/3NLCAMB",
    blogUrl: "/blog/ansible-for-kubernetes-by-example/",
  },
  {
    id: "ansible-for-vmware-by-examples-apress",
    title: "Ansible for VMware by Examples",
    author: LUCA,
    blurb: "Automate VMware environments with Ansible. This book covers all you need to manage your VMware infrastructure with Ansible.",
    cover: ansibleForVmwareApress,
    topic: "ansible",
    format: "book",
    publisher: "Apress",
    amazon: "https://amzn.to/3XHeDLd",
    blogUrl: "/blog/ansible-for-vmware-by-examples/",
  },
  {
    id: "learn-ansible-2nd-edition",
    title: "Learn Ansible 2nd edition",
    author: "Russ McKendrick (Technical review: Luca Berton)",
    blurb: "Automate your cloud infrastructure, security configuration, and application deployment with Ansible.",
    cover: learnAnsible,
    topic: "ansible",
    format: "book",
    amazon: "https://amzn.to/3R6l0Wh",
  },

  // Leanpub ebooks
  ebook("kubernetes-ai", "Kubernetes AI", "Run LLMs and GPU workloads on Kubernetes: inference, training, NVIDIA GPUs, storage, networking, security and operations.", kubernetesAi, "kubernetes"),
  ebook("openshift-ai", "OpenShift AI Platform Guide", "Build a GPU-enabled, air-gapped AI platform on OpenShift: mirroring, operators, InfiniBand/RDMA, observability, GitOps and LLM benchmarks.", openshiftAi, "kubernetes"),
  ebook("ai-that-scales", "AI That Scales", "Why enterprise AI programs fail to operate at scale, and how to fix costs, ownership, governance and vendor dependency.", aiThatScales, "ai"),
  ebook("agentic-ai", "Agentic Artificial Intelligence", "A practical guide to designing autonomous, goal-driven AI systems: architectures, tools and ethical design.", agenticAi, "ai"),
  ebook("ai-transformation", "AI Transformation", "How organizations make AI operable: hidden costs, ownership, governance and vendor dependency.", aiTransformation, "ai"),
  ebook("ansiblebyexamples", "Ansible by Examples", "Copy-and-paste Ansible playbooks that automate everyday system administration on Linux and Windows.", ansibleByExamples, "ansible"),
  ebook("Ansible-Automation-Platform", "Ansible Automation Platform By Example", "A step-by-step guide to the most common Ansible Automation Platform scenarios.", ansibleAutomationPlatform, "ansible"),
  ebook("ansible-awx-by-examples", "Ansible AWX By Examples", "Learn Ansible AWX automation with real-life examples.", ansibleAwx, "ansible"),
  ebook("ansible-cookbook", "Ansible Cookbook", "Best practices, troubleshooting and linting rules for reliable IT automation with Ansible.", ansibleCookbook, "ansible"),
  ebook("mastering-ansible", "Mastering Ansible: Best Practices and Troubleshooting", "Best practices, troubleshooting and linting rules for reliable Ansible automation.", masteringAnsible, "ansible"),
  ebook("ansible-tips-and-tricks", "Ansible Tips and Tricks", "Real-life examples of the most common Ansible modules and playbooks.", ansibleTipsAndTricks, "ansible"),
  ebook("ansible-for-aws-by-examples", "Ansible for AWS By Examples", "Automate AWS infrastructure with Ansible, with real-life examples.", ansibleForAws, "ansible"),
  ebook("ansibleforwindowsbyexamples", "Ansible for Windows By Examples", "Copy-and-paste playbooks for Windows administrators, with fixes for the most common errors.", ansibleForWindows, "ansible"),
  ebook("ansibleforlinuxbyexamples", "Ansible for Linux By Examples", "Automate everyday Linux administration with Ansible playbooks.", ansibleForLinux, "ansible"),
  ebook("ansiblelinuxusersandgroupsbyexamples", "Ansible Linux Users & Groups By Examples", "Manage Linux users and groups with real-life Ansible playbooks.", ansibleUsersGroups, "ansible"),
  ebook("linuxfileanddirectorybyansibleexamples", "Ansible Linux Filesystem By Examples", "Automate everyday file and directory tasks with Ansible.", ansibleFilesystem, "ansible"),
  ebook("ansible-for-postgresql-by-examples", "Ansible for PostgreSQL By Examples", "Automate PostgreSQL databases with Ansible playbooks.", ansibleForPostgresql, "ansible"),
  ebook("ansibleforsecuritybyexamples", "Ansible for Security By Examples", "Automate security and compliance tasks with Ansible.", ansibleForSecurity, "ansible"),
  ebook("red-hat-enterprise-linux-10", "Red Hat Enterprise Linux 10 Handbook", "Installation, system management, security, performance tuning and automation for RHEL 10.", rhel10, "linux_cloud"),
  ebook("terraform-by-example", "Terraform By Example", "Cloud infrastructure automation with Terraform, learned through practical examples and labs.", terraformByExample, "linux_cloud"),
  ebook("azure-devtest-labs-handbook", "Azure DevTest Labs Handbook", "Automate environments, optimize resources and streamline CI/CD with Azure DevTest Labs.", azureDevTestLabs, "linux_cloud"),
];

export const BOOKS_BY_ID: Record<string, Book> = Object.fromEntries(BOOKS.map((b) => [b.id, b]));

/** The pill row under a card's text, e.g. ["Ebook", "Leanpub"] or ["Book", "Apress"]. */
export function bookPills(book: Book): string[] {
  if (book.format === "ebook") return ["Ebook", "Leanpub"];
  return book.publisher ? ["Book", book.publisher] : ["Book"];
}

/** "Ebook by Luca Berton", "Book by Luca Berton", or "Book" for co-authored / reviewed titles. */
export function bookEyebrow(book: Book): string {
  const kind = book.format === "ebook" ? "Ebook" : "Book";
  return book.author === LUCA ? `${kind} by ${LUCA}` : kind;
}

/** Author line, shown only when it is not just Luca. */
export function bookByline(book: Book): string | undefined {
  return book.author === LUCA ? undefined : book.author;
}

export interface BookLinkAction {
  label: string;
  href: string;
  variant: "primary" | "secondary" | "link";
  ariaLabel?: string;
}

/** Buttons for a book card: Leanpub first for ebooks, then Amazon, then the page about the book. */
export function bookActions(book: Book): BookLinkAction[] {
  const actions: BookLinkAction[] = [];
  if (book.leanpub) {
    actions.push({ label: "Get the ebook", href: book.leanpub, variant: "primary", ariaLabel: `Get the ebook: ${book.title} on Leanpub` });
  }
  if (book.amazon) {
    actions.push({
      label: "Buy on Amazon",
      href: book.amazon,
      variant: actions.length ? "secondary" : "primary",
      ariaLabel: `Buy on Amazon: ${book.title}`,
    });
  }
  if (book.blogUrl) {
    actions.push({ label: "About the book", href: book.blogUrl, variant: "link", ariaLabel: `About the book: ${book.title}` });
  }
  return actions;
}

/** Leanpub team packs (3–25 copies) for an ebook; null for published books. */
export function bookTeamLink(book: Book): string | null {
  if (book.format !== "ebook") return null;
  return leanpubTeamUrl(
    book.id,
    `utm_source=lucaberton.com&utm_medium=referral&utm_campaign=leanpub-${book.id.toLowerCase()}&utm_content=books-team`,
  );
}
