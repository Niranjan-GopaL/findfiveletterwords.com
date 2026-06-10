/**
 * Base-path helpers.
 *
 * While the site is parked on GitHub *project* pages it lives under
 * /findfiveletterwords.com/, so every internal link must be prefixed with
 * the configured `base`. Once the real domain is live (base: '/'), `url()`
 * becomes a no-op and nothing else has to change.
 */

/** '' when base is '/', otherwise '/findfiveletterwords.com' (no trailing slash). */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** True when building for the temporary GitHub Pages deployment. */
export const IS_PREVIEW_DEPLOY = BASE !== '';

/** The production origin. Canonical URLs always point here, on every deploy. */
export const PROD_ORIGIN = 'https://findfiveletterwords.com';

/** Prefix a root-relative path ('/5-letter-words/') with the deploy base. */
export function url(path: string): string {
  return BASE + path;
}

/** Canonical URL on the production domain for a root-relative path. */
export function canonicalUrl(path: string): string {
  return PROD_ORIGIN + path;
}
