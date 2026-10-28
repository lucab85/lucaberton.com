# Sponsored banners on Luca's sites

One config drives the sponsored banner on all eight sites:
`static/promo/promos.json` in this repo, served at
`https://lucaberton.com/promo/promos.json`.

## Change or schedule a campaign

1. Put the images in `static/promo/<campaign-id>/`: `wide.webp` and `wide.jpg`
   (the 1200x300 strip, at 2x), `card-800.webp`, `card-1200.webp` and
   `card.jpg` (the full creative, for phones). `scripts/generate-lf-halloween-banners.mjs`
   shows how the October 2026 set was built from a partner creative.
2. Add the campaign at the top of `campaigns` in `promos.json` (the first match
   wins), or edit the current one:
   - `sites`: `["*"]` or site ids (`lucaberton.com`, `udienza.com`,
     `ansiblepilot.com`, `ansiblebyexample.com`, `openempower.com`,
     `copypastelearn.com`, `terraformpilot.com`, `kubernetes.recipes`)
   - `start`: `YYYY-MM-DD`, from each visitor's local midnight
   - `end`: an ISO instant, e.g. `2026-10-30T00:00:00Z` (partners often end in UTC)
   - `enabled: false` turns a campaign off without deleting it
   - `href`, `code` (optional), `alt`, `caption`, `disclosure` (optional),
     `image.base` + the `wide`/`card` sizes, `tracking` (campaign, company, offerId)
3. Run `node scripts/sync-promo.mjs lucaberton.com --local static/promo/promos.json`:
   it validates the file and writes `src/generated/promo.json`.
4. Merge to `main`. CI/CD deploys this site; then the `Promo redeploy` workflow
   waits until the new file is live and rebuilds the other sites (secrets
   `PROMO_DEPLOY_HOOKS` and `PROMO_DISPATCH_TOKEN`, see the workflow).

A campaign can be merged ahead of time: it shows itself on its start date and
hides itself at its end, on every visitor's clock, without another deploy.

## How the sites use it

Every site carries an identical `scripts/sync-promo.mjs`, run at the start of
its build. It picks the first enabled, unexpired campaign that lists the site,
resolves it into `src/generated/promo.json` (or `null`) and the site's
`PromoBanner` component renders that file. If the config cannot be fetched,
the script keeps the last synced campaign, so a build never fails because of
it. udienza.com runs it with `--self-host public`, which copies the images
into the site (its SEO validator forbids third-party images).

The banner is in the page from the build, but CSS hides it unless an inline
script right before it has flagged `<html>` with `data-promo-on` for the
campaign window. Because the flag is set while the page is parsed, the banner
is laid out visible from the start and never shifts the layout.

Edit `scripts/sync-promo.mjs` here and copy it to the other repos unchanged.
