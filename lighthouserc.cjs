/**
 * Lighthouse CI configuration
 * Docs: https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
 *
 * By default audits the static build under ./public.
 * Override target with LHCI_BASE_URL=https://example.com to audit a live URL
 * (in that case, do not set staticDistDir).
 */
const BASE = process.env.LHCI_BASE_URL;
const PATHS = ['/', '/about/', '/blog/', '/contact/', '/gpu-cost-calculator/'];

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
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
  },
};
