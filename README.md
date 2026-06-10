# findfiveletterwords.com

A free, frequency-sorted word finder and word-list library for Wordle, Scrabble,
Words With Friends, and crosswords. ~183,000 words, 2 to 20 letters,
1,732 statically generated pages.

**Live preview (temporary, noindexed):**
<https://niranjan-gopal.github.io/findfiveletterwords.com/>

## What makes it different

- **Frequency order, not alphabetical.** Every list is ranked by how often each
  word appears in the Norvig trillion-word corpus, so likely puzzle answers sit
  in the first rows.
- **Five dictionaries** behind one switch: combined tournament list (default),
  Wordle answers, Words With Friends (ENABLE), Scrabble US (TWL06), Scrabble UK
  (SOWPODS/CSW). Encoded as bitmask flags so the whole solver runs client-side
  from one small JSON per length.
- **Accessibility-first UI:** light/dark themes with muted dark-mode palette,
  4-step text-size control, fully remappable keyboard shortcuts (`?` opens the
  list), reduced-motion support, labelled controls throughout.

## Stack

Astro 6 (fully static output) · Tailwind CSS 4 · no backend, no analytics
scripts. The interactive finder is plain TypeScript in one inline module.

## Development

Requires Node >= 22.12.

```sh
npm install
npm run dev        # localhost:4321
npm run build      # production build (site: findfiveletterwords.com, base: /)
npm run preview
```

### Regenerating the word data

```sh
node scripts/build-wordlists.mjs
```

Downloads (cached in `scripts/raw/`, gitignored) ENABLE1, TWL06
(`norvig.com/ngrams/TWL06.txt` -- the wordgamedictionary.com mirror is
truncated, do not use it), SOWPODS, the Wordle answer list, the Norvig
`count_1w` frequency table, and the LDNOOBW blocklist. Emits
`src/data/words-N.json` (page lists, ENABLE ∪ TWL) and `src/data/dicts-N.json`
(solver data with dictionary flags) for N = 2..20. Lengths 16-20 exist only in
ENABLE; Scrabble lists stop at the 15-square board.

## Deployment

### Now: GitHub project pages (feedback round)

`.github/workflows/deploy.yml` deploys on every push to `main`. It builds with
`GITHUB_PAGES=true`, which:

- sets `site: https://niranjan-gopal.github.io`, `base: /findfiveletterwords.com`
  (the repo name **must** stay `findfiveletterwords.com` for the base to match);
- adds `<meta name="robots" content="noindex, nofollow">` to every page;
- keeps every `<link rel="canonical">` pointing at `https://findfiveletterwords.com`;
- overwrites `robots.txt` with `Disallow: /`.

So even if the preview stays up longer than planned, Google will not index it
and it cannot create a duplicate of the future production site.

One-time repo setup: *Settings → Pages → Source: GitHub Actions.*

**Unpublishing when the feedback round is over** (manual, ~10 seconds):

```sh
gh api -X DELETE repos/niranjan-gopal/findfiveletterwords.com/pages
gh repo edit niranjan-gopal/findfiveletterwords.com --visibility private --accept-visibility-change-consequences
```

### Later: the real domain (Cloudflare Pages)

1. Buy `findfiveletterwords.com`, create a Cloudflare Pages project, build
   command `npm run build`, output `dist` -- **without** the `GITHUB_PAGES` env
   var. `base` returns to `/` and the `url()` helper in `src/lib/url.ts`
   becomes a no-op; nothing else changes.
2. Redirect the `*.pages.dev` preview subdomain to the custom domain (Bulk
   Redirects, or a `_redirects` file) so it never competes in search.
3. Google Search Console: verify the domain, submit `/sitemap-index.xml`.
4. Set up `contact@findfiveletterwords.com` email forwarding.
5. Apply for AdSense once pages are indexed.

## Internal links and the base path

All internal links go through `url()` from `src/lib/url.ts`, which prefixes the
configured `base`. Markdown content keeps plain root-relative links; a rehype
plugin in `astro.config.mjs` prefixes those at build time. Canonical URLs are
built with `canonicalUrl()` and always point at the production domain.

## Project layout

```
scripts/build-wordlists.mjs   word-data pipeline (run manually when sources change)
src/data/                     generated words-N.json / dicts-N.json (committed)
src/lib/words.ts              lengths, dictionaries, points tables
src/lib/pages.ts              the 1,700-page programmatic page definitions
src/lib/url.ts                base-path + canonical helpers
src/pages/data/               JSON endpoint serving dicts-N.json to the finder
src/layouts/BaseLayout.astro  shell: header, ticker, footer, shortcuts, theming
src/content/blog/             editorial articles (Markdown)
```
