// Builds src/data/words-{4,5,6,7}.json from public-domain sources.
// Words are sorted most-common-first using Google web-corpus frequencies,
// then alphabetically for words without frequency data.
//
// Sources:
//   ENABLE1 word list (public domain)  — the standard tournament word list
//   Norvig count_1w.txt                — 1/3M most frequent English tokens
//   LDNOOBW blocklist                  — filtered out for ad-safety
//
// Usage: node scripts/build-wordlists.mjs

import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const RAW_DIR = path.join(ROOT, 'scripts', 'raw');
const OUT_DIR = path.join(ROOT, 'src', 'data');

const SOURCES = {
  'enable1.txt':
    'https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt',
  'count_1w.txt': 'https://norvig.com/ngrams/count_1w.txt',
  'blocklist-en.txt':
    'https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en',
};

const LENGTHS = [4, 5, 6, 7];

async function fetchCached(name, url) {
  const file = path.join(RAW_DIR, name);
  try {
    await access(file);
    console.log(`cached   ${name}`);
  } catch {
    console.log(`fetching ${name} ← ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
    await writeFile(file, await res.text());
  }
  return readFile(file, 'utf8');
}

async function main() {
  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  const [enableRaw, countsRaw, blockRaw] = await Promise.all(
    Object.entries(SOURCES).map(([name, url]) => fetchCached(name, url)),
  );

  const blocked = new Set(
    blockRaw
      .split('\n')
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w && !w.includes(' ')),
  );

  const rank = new Map();
  countsRaw.split('\n').forEach((line, i) => {
    const word = line.split('\t')[0]?.trim();
    if (word && !rank.has(word)) rank.set(word, i);
  });

  const buckets = new Map(LENGTHS.map((len) => [len, []]));
  for (const line of enableRaw.split('\n')) {
    const w = line.trim().toLowerCase();
    if (!/^[a-z]+$/.test(w)) continue;
    if (!buckets.has(w.length)) continue;
    if (blocked.has(w)) continue;
    buckets.get(w.length).push(w);
  }

  const UNRANKED = Number.MAX_SAFE_INTEGER;
  for (const [len, words] of buckets) {
    words.sort((a, b) => {
      const ra = rank.get(a) ?? UNRANKED;
      const rb = rank.get(b) ?? UNRANKED;
      return ra - rb || (a < b ? -1 : 1);
    });
    const out = path.join(OUT_DIR, `words-${len}.json`);
    await writeFile(out, JSON.stringify(words));
    const ranked = words.filter((w) => rank.has(w)).length;
    console.log(
      `words-${len}.json  ${words.length} words (${ranked} frequency-ranked)  top: ${words.slice(0, 8).join(', ')}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
