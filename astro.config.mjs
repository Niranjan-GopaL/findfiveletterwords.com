// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Temporary GitHub *project* pages deploy (feedback round before buying the
// domain): https://niranjan-gopal.github.io/findfiveletterwords.com/
//
// The workflow in .github/workflows/deploy.yml builds with GITHUB_PAGES=true,
// which switches site/base below. That build also gets a site-wide
// <meta name="robots" content="noindex"> and canonicals pointing at the real
// domain (see BaseLayout), so it can never compete with or duplicate the
// production site in Google.
//
// 👉 When the domain is bought: deploy to Cloudflare Pages WITHOUT the env
//    var (site stays findfiveletterwords.com, base '/'), and the url()
//    helper in src/lib/url.ts becomes a no-op. No other changes needed.
const ghPages = process.env.GITHUB_PAGES === 'true';

/**
 * Markdown content uses root-relative internal links (/5-letter-words/…).
 * On GitHub Pages those need the base prefix; this rehype plugin adds it.
 */
function rehypeBasePrefix() {
  const base = ghPages ? '/findfiveletterwords.com' : '';
  return () => (tree) => {
    if (!base) return;
    const walk = (node) => {
      if (node.type === 'element' && node.tagName === 'a') {
        const href = node.properties?.href;
        if (typeof href === 'string' && href.startsWith('/')) {
          node.properties.href = base + href;
        }
      }
      for (const child of node.children ?? []) walk(child);
    };
    walk(tree);
  };
}

// https://astro.build/config
export default defineConfig({
  site: ghPages ? 'https://niranjan-gopal.github.io' : 'https://findfiveletterwords.com',
  base: ghPages ? '/findfiveletterwords.com' : '/',
  vite: {
    plugins: [tailwindcss()]
  },

  markdown: {
    rehypePlugins: [rehypeBasePrefix()]
  },

  integrations: [sitemap()]
});
