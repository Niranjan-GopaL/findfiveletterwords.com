// Builds the word data for lengths 2–15 from public word lists.
//
// Outputs per length N:
//   src/data/words-N.json -- page lists: ENABLE ∪ TWL (US tournament standard),
//                            sorted most-common-first
//   src/data/dicts-N.json -- solver data: { w: union of all dictionaries,
//                           f: bitmask flags } same frequency order
//
// Flag bits: 1 = ENABLE/Words With Friends, 2 = Scrabble US (TWL06),
//            4 = Scrabble UK (SOWPODS/CSW), 8 = Wordle answer (5-letter only)
//
// Sources (cached in scripts/raw/, gitignored):
//   ENABLE1, Norvig count_1w frequencies, LDNOOBW blocklist,
//   TWL06, SOWPODS, Wordle answer list
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
  'twl06.txt': 'https://norvig.com/ngrams/TWL06.txt',
  'sowpods.txt':
    'https://raw.githubusercontent.com/jesstess/Scrabble/master/scrabble/sowpods.txt',
  'wordle-answers.txt':
    'https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/wordle-answers-alphabetical.txt',
};

const MIN_LEN = 2;
const MAX_LEN = 15;

export const FLAG_ENABLE = 1;
export const FLAG_TWL = 2;
export const FLAG_CSW = 4;
export const FLAG_WORDLE = 8;

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

function toWordSet(raw, { minWords, label }) {
  const words = raw
    .split('\n')
    .map((l) => l.trim().toLowerCase())
    .filter((w) => /^[a-z]+$/.test(w));
  if (words.length < minWords) {
    console.warn(
      `WARNING: ${label} parsed only ${words.length} words (expected ≥ ${minWords}), skipping this dictionary`,
    );
    return null;
  }
  return new Set(words);
}

async function main() {
  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  const raw = {};
  for (const [name, url] of Object.entries(SOURCES)) {
    raw[name] = await fetchCached(name, url);
  }

  const blocked = new Set(
    raw['blocklist-en.txt']
      .split('\n')
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w && !w.includes(' ')),
  );

  const rank = new Map();
  raw['count_1w.txt'].split('\n').forEach((line, i) => {
    const word = line.split('\t')[0]?.trim();
    if (word && !rank.has(word)) rank.set(word, i);
  });

  const enable = toWordSet(raw['enable1.txt'], { minWords: 100000, label: 'ENABLE' });
  if (!enable) throw new Error('ENABLE list failed to parse, aborting');
  const twl = toWordSet(raw['twl06.txt'], { minWords: 100000, label: 'TWL06' });
  const csw = toWordSet(raw['sowpods.txt'], { minWords: 150000, label: 'SOWPODS' });
  const wordle = toWordSet(raw['wordle-answers.txt'], { minWords: 2000, label: 'Wordle answers' });

  const UNRANKED = Number.MAX_SAFE_INTEGER;
  const byLength = new Map();
  for (let len = MIN_LEN; len <= MAX_LEN; len++) byLength.set(len, new Set());

  const addAll = (set) => {
    if (!set) return;
    for (const w of set) {
      if (w.length < MIN_LEN || w.length > MAX_LEN) continue;
      if (blocked.has(w)) continue;
      byLength.get(w.length).add(w);
    }
  };
  addAll(enable);
  addAll(twl);
  addAll(csw);
  addAll(wordle);

  console.log('\nlen   pages(EN∪TWL)  union  twl    csw    wordle  top words');
  for (let len = MIN_LEN; len <= MAX_LEN; len++) {
    const union = [...byLength.get(len)].sort((a, b) => {
      const ra = rank.get(a) ?? UNRANKED;
      const rb = rank.get(b) ?? UNRANKED;
      return ra - rb || (a < b ? -1 : 1);
    });
    const flags = union.map(
      (w) =>
        (enable.has(w) ? FLAG_ENABLE : 0) |
        (twl?.has(w) ? FLAG_TWL : 0) |
        (csw?.has(w) ? FLAG_CSW : 0) |
        (wordle?.has(w) && len === 5 ? FLAG_WORDLE : 0),
    );

    const pageWords = union.filter((_, i) => flags[i] & (FLAG_ENABLE | FLAG_TWL));

    await writeFile(path.join(OUT_DIR, `words-${len}.json`), JSON.stringify(pageWords));
    await writeFile(
      path.join(OUT_DIR, `dicts-${len}.json`),
      JSON.stringify({ w: union, f: flags }),
    );

    const count = (bit) => flags.filter((f) => f & bit).length;
    console.log(
      String(len).padEnd(6) +
        String(pageWords.length).padEnd(15) +
        String(union.length).padEnd(7) +
        String(count(FLAG_TWL)).padEnd(7) +
        String(count(FLAG_CSW)).padEnd(7) +
        String(count(FLAG_WORDLE)).padEnd(8) +
        pageWords.slice(0, 5).join(', '),
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
