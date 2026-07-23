# lucaberton.com

Personal and consulting website of [Luca Berton](https://lucaberton.com) — AI & Cloud Advisor based in Amsterdam.

## Tech Stack

- **[Astro](https://astro.build)** 5.x — Static site generator
- **[Tailwind CSS](https://tailwindcss.com)** v4 — Utility-first CSS
- **[MDX](https://mdxjs.com)** — Blog content with component support
- **[astro-icon](https://github.com/natemoo-re/astro-icon)** — SVG icon system
- **[astro-embed](https://github.com/astro-community/astro-embed)** — YouTube embeds
- **[astro-seo](https://github.com/jonasmerlin/astro-seo)** — SEO meta tags
- **[Sharp](https://sharp.pixelplumbing.com)** — Image optimization

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
src/
├── components/       # Reusable Astro components
├── content/
│   └── blog/         # 339 MDX blog posts
├── layouts/          # Page layouts (Layout.astro)
├── pages/            # Route pages
│   ├── blog/         # Blog index & pagination
│   ├── categories/   # Category pages
│   ├── services/     # Service pages
│   └── ...           # Standalone pages
├── styles/           # Global CSS
└── utils/            # Utility functions
static/               # Static assets (images, fonts, files)
scripts/              # Build & deployment scripts
```

## Key Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — dark cinematic hero, services, KPIs |
| `/blog/` | Blog with 339+ articles on AI, Kubernetes, DevOps, Platform Engineering |
| `/about/` | About Luca Berton |
| `/services/` | Consulting services |
| `/conferences/` | Speaking engagements |
| `/books/` | Published books |
| `/gpu-cost-calculator/` | GPU Cost Calculator lead magnet |
| `/book-signing/` | Kubernetes Recipes book signing events |
| `/talk/` | Conference talk landing page with lead capture |
| `/contact/` | Contact form |

## Blog

339+ articles covering:

- **AI** — Agentic AI, LLMs, AI governance, enterprise strategy
- **Platform Engineering** — Kubernetes, internal developer platforms, GitOps
- **Automation** — Ansible, Terraform, CI/CD pipelines
- **DevOps** — Observability, SRE, cloud-native patterns
- **Open Source** — CNCF projects, community events, contributions

Blog posts are MDX files in `src/content/blog/` with frontmatter:

```yaml
---
title: "Post Title"
snippet: "Meta description under 160 characters."
publishDate: "2026-03-18"
image: { src: "/blog/image.jpg", alt: "Alt text" }
category: "AI"
author: "Luca Berton"
tags: ["tag1", "tag2"]
draft: false
lastModified: "2026-03-18"
---
```

## Deployment

Hosted on **GitLab Pages** behind **Cloudflare**. CI/CD via `.gitlab-ci.yml`:

- Builds on every push to `main`
- Auto-submits new URLs to search engines via [IndexNow](https://www.indexnow.org/)

## SEO & Integrations

- **Sitemap** — auto-generated at `/sitemap-index.xml`
- **RSS** — available at `/rss.xml`
- **IndexNow** — instant search engine notification on deploy
- **Kit.com** — email newsletter lead capture
- **Google Tag Manager** — analytics
- **Microsoft Clarity** — session recordings
- **Structured Data** — JSON-LD for ProfessionalService, BreadcrumbList, BlogPosting

## Network

Part of the Luca Berton content network:

- [ansiblepilot.com](https://www.ansiblepilot.com) — Ansible automation
- [terraformpilot.com](https://www.terraformpilot.com) — Terraform IaC
- [kubernetes.recipes](https://kubernetes.recipes) — Kubernetes cookbook
- [copypastelearn.com](https://www.copypastelearn.com) — Learning academy
- [openempower.com](https://www.openempower.com) — Open source empowerment
- [techmeout.it](https://techmeout.it) — Tech community

## License

All rights reserved. Content © Luca Berton.
