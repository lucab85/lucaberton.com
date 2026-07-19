/**
 * Lighthouse CI configuration
 * Docs: https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
 *
 * By default audits the static build under ./public.
 * Override target with LHCI_BASE_URL=https://example.com to audit a live URL
 * (in that case, do not set staticDistDir).
 */
const BASE = process.env.LHCI_BASE_URL;
const PATHS = ['/', '/about/', '/blog/', '/contact/', '/gpu-cost-calculator/', '/ai-platform-engineer-bootcamp/', '/ai-platform-engineer-readiness-scorecard/'];

const staticUrls = PATHS.map((p) => `http://localhost${p === '/' ? '/index.html' : p + 'index.html'}`);
const liveUrls = BASE ? PATHS.map((p) => new URL(p, BASE).toString()) : null;

module.exports = {
  ci: {
    collect: {
      ...(BASE ? {} : { staticDistDir: './public' }),
      url: liveUrls || staticUrls,
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --headless',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        // best-practices is artificially low when serving over http://localhost
        // (uses-https, csp-xss audits penalize the test environment, not prod).
        // When LHCI_BASE_URL is set (live origin), raise this back to 0.9.
        'categories:best-practices': ['warn', { minScore: 0.5 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        // Cloudflare injects a `Content-Signal:` directive into robots.txt at
        // the edge. Lighthouse flags it as "Unknown directive" even though it
        // is part of an emerging standard. We can't strip it from the repo, so
        // downgrade this single audit to a warning. Disable Cloudflare's
        // managed robots.txt content to clear it for real.
        'robots-txt': 'warn',
      },
    },
  },
};
