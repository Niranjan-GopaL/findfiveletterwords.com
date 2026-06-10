import {
  ALPHABET,
  CONTAINS_MAX_LEN,
  LENGTH_NAMES,
  LENGTHS,
  VOWELS,
  WORD_LISTS,
  formatCount,
  sectionFor,
  topWords,
  type WordLength,
} from './words';

export interface Link {
  href: string;
  label: string;
}

export interface LinkGroup {
  heading: string;
  links: Link[];
}

export interface Faq {
  q: string;
  a: string;
}

export interface PageDef {
  section: string;
  slug: string;
  h1: string;
  title: string;
  description: string;
  intro: string[];
  tip: string;
  words: string[];
  faqs: Faq[];
  linkGroups: LinkGroup[];
}

/** Pages with fewer matches than this are not generated (thin content). */
const MIN_WORDS = 3;

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pick<T>(options: T[], seed: string): T {
  return options[hash(seed) % options.length];
}

function up(c: string): string {
  return c.toUpperCase();
}

function href(section: string, slug?: string): string {
  return slug ? `/${section}/${slug}/` : `/${section}/`;
}

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'];

/* ------------------------------------------------------------------ */
/* Copy templates — varied per page via slug hash so phrasing differs  */
/* across the site instead of repeating one sentence 2,000 times.      */
/* ------------------------------------------------------------------ */

interface FamilyCopy {
  /** e.g. "Starting With S" */
  phrase: string;
  /** e.g. "that start with S" */
  phraseLower: string;
}

/** The games worth mentioning for a given word length. */
function gamesFor(len: WordLength): string {
  if (len === 5) return 'Wordle, Scrabble, and Words With Friends';
  if (len <= 8) return 'Scrabble, Words With Friends, and other word games';
  return 'Scrabble, crosswords, and other word puzzles';
}

function introTemplates(len: WordLength, c: FamilyCopy, words: string[], seed: string): string[] {
  const n = formatCount(words.length);
  const name = LENGTH_NAMES[len];
  const top3 = topWords(words, 3);
  const games = gamesFor(len);
  const variants: string[][] = [
    [
      `Looking for ${name}-letter words ${c.phraseLower}? There are ${n} of them in the tournament word lists, and every one is on this page. The most common — ${top3} — sit right at the top.`,
      `Unlike alphabetical lists that bury likely answers in the middle, this list is sorted by how often each word appears in everyday English. Scan the first rows for probable answers; dig deeper for rare, high-scoring plays.`,
    ],
    [
      `There are ${n} ${name}-letter words ${c.phraseLower}. The list below ranks them by real-world frequency, so everyday words like ${top3} appear before the tournament obscurities.`,
      `Every entry comes from the tournament word lists used in ${games}, so you can play each one with confidence.`,
    ],
    [
      `Our word finder knows ${n} ${name}-letter words ${c.phraseLower}. Common picks such as ${top3} lead the list, which makes it faster to spot the word your puzzle is hiding.`,
      `Words are ordered by usage frequency in a trillion-word English corpus — the closest thing to "most likely answer first" that a word list can offer.`,
    ],
  ];
  return pick(variants, seed);
}

const TIPS_WORDLE = [
  'Solving Wordle? Answers are almost always everyday words, so start from the top of this list — the frequency sort puts likely answers where you can see them.',
  'Stuck on yellows? A repeated letter is often the trick. Check the double-letter list, then come back and scan the common band again.',
  'If you still have several candidates, prefer words with distinct, common letters — each guess then eliminates more of the alphabet.',
];
const TIPS_GENERAL = [
  'For Scrabble or Words With Friends, scroll to the bottom: the rare words live there, and rare letters usually mean bigger scores.',
  'Use the sort control above the list to flip between common-first, alphabetical, and highest-scoring order.',
  'Narrow things down faster with the word finder on the home page — lock in the letters you know and it filters the entire dictionary in an instant.',
];

function pickTip(len: WordLength, seed: string): string {
  const pool = len === 5 ? [...TIPS_WORDLE, ...TIPS_GENERAL] : TIPS_GENERAL;
  return pick(pool, seed);
}

function faqsFor(len: WordLength, c: FamilyCopy, words: string[], seed: string): Faq[] {
  const n = formatCount(words.length);
  const name = LENGTH_NAMES[len];
  const top3 = topWords(words, 3);
  const top5 = topWords(words, 5);
  const validity: Faq[] = [
    {
      q: 'Can I play these words in Scrabble?',
      a: 'Yes. The list combines ENABLE and the North American tournament list (TWL), so these words are playable in Scrabble-style games, including Words With Friends.',
    },
    {
      q: 'Why are the words in this order?',
      a: 'Words are ranked by how often they appear in a trillion-word corpus of written English — most common first. That surfaces likely puzzle answers instead of hiding them mid-alphabet. Use the sort control to switch to alphabetical or points order.',
    },
  ];
  if (len === 5) {
    validity.push({
      q: 'Are these valid Wordle words?',
      a: 'Nearly all of them. Wordle draws its answers from a curated list of common five-letter words, but it accepts almost any dictionary word as a guess — including the words on this page.',
    });
  }
  return [
    {
      q: `How many ${name}-letter words are there ${c.phraseLower}?`,
      a: `There are ${n} ${name}-letter words ${c.phraseLower} in the tournament word lists. The most common are ${top3}.`,
    },
    {
      q: `What are common ${name}-letter words ${c.phraseLower}?`,
      a: `${top5} are the most frequently used. The full list of ${n} words on this page is sorted by everyday frequency, so the common ones come first.`,
    },
    pick(validity, seed + 'v'),
  ];
}

function descriptionFor(len: WordLength, c: FamilyCopy, words: string[], seed: string): string {
  const n = formatCount(words.length);
  const name = LENGTH_NAMES[len];
  const games = gamesFor(len);
  const variants = [
    `All ${n} ${name}-letter words ${c.phraseLower}, sorted with the most common first. Free word list and finder for ${games}.`,
    `Browse ${n} ${name}-letter words ${c.phraseLower} — common words first, rare ones last. Perfect for cracking today's puzzle or planning a high-scoring play.`,
    `Complete list of ${n} ${name}-letter words ${c.phraseLower}, ranked by everyday usage, with Scrabble points for every word. Free, no sign-up.`,
  ];
  return pick(variants, seed);
}

/* ------------------------------------------------------------------ */
/* Page builders                                                       */
/* ------------------------------------------------------------------ */

function buildPage(
  len: WordLength,
  slug: string,
  h1: string,
  copy: FamilyCopy,
  words: string[],
  linkGroups: LinkGroup[],
  overrides: Partial<Pick<PageDef, 'intro' | 'faqs' | 'title' | 'description'>> = {},
): PageDef {
  const section = sectionFor(len);
  const seed = `${section}/${slug}`;
  return {
    section,
    slug,
    h1,
    title: overrides.title ?? `${h1} — ${formatCount(words.length)} Words`,
    description: overrides.description ?? descriptionFor(len, copy, words, seed),
    intro: overrides.intro ?? introTemplates(len, copy, words, seed),
    tip: pickTip(len, seed + 't'),
    words,
    faqs: overrides.faqs ?? faqsFor(len, copy, words, seed),
    linkGroups,
  };
}

function letterChips(
  section: string,
  prefix: string,
  letters: string[],
  exists: (c: string) => boolean,
  labelFor: (c: string) => string,
): Link[] {
  return letters
    .filter(exists)
    .map((c) => ({ href: href(section, `${prefix}${c}`), label: labelFor(c) }));
}

interface FamilyIndex {
  startingWith: Map<string, string[]>;
  endingIn: Map<string, string[]>;
  withLetter: Map<string, string[]>;
  pairs: Map<string, string[]>; // key "ae" (alphabetical), 5-letter only
  startEnd: Map<string, string[]>; // key "se" (start, end), 5-letter only
  positions: Map<string, string[]>; // key "e2", 5-letter only
}

function indexFamilies(len: WordLength): FamilyIndex {
  const words = WORD_LISTS[len];
  const idx: FamilyIndex = {
    startingWith: new Map(),
    endingIn: new Map(),
    withLetter: new Map(),
    pairs: new Map(),
    startEnd: new Map(),
    positions: new Map(),
  };
  const push = (map: Map<string, string[]>, key: string, w: string) => {
    let arr = map.get(key);
    if (!arr) map.set(key, (arr = []));
    arr.push(w);
  };
  const wantContains = len <= CONTAINS_MAX_LEN;
  for (const w of words) {
    push(idx.startingWith, w[0], w);
    push(idx.endingIn, w[len - 1], w);
    if (wantContains) {
      const seen = new Set<string>();
      for (const ch of w) {
        if (!seen.has(ch)) {
          seen.add(ch);
          push(idx.withLetter, ch, w);
        }
      }
      if (len === 5) {
        push(idx.startEnd, w[0] + w[4], w);
        const uniq = [...seen].sort();
        for (let i = 0; i < uniq.length; i++)
          for (let j = i + 1; j < uniq.length; j++) push(idx.pairs, uniq[i] + uniq[j], w);
        for (let p = 1; p <= 3; p++) push(idx.positions, w[p] + String(p + 1), w);
      }
    }
  }
  return idx;
}

const indexCache = new Map<WordLength, FamilyIndex>();
function familiesFor(len: WordLength): FamilyIndex {
  let idx = indexCache.get(len);
  if (!idx) indexCache.set(len, (idx = indexFamilies(len)));
  return idx;
}

function ok(words: string[] | undefined): words is string[] {
  return !!words && words.length >= MIN_WORDS;
}

/* ------------------------------------------------------------------ */
/* All pages for a length                                              */
/* ------------------------------------------------------------------ */

function buildAllPages(len: WordLength): PageDef[] {
  const idx = familiesFor(len);
  const section = sectionFor(len);
  const Name = `${len}-Letter`;
  const pages: PageDef[] = [];
  const hub: Link = { href: href(section), label: `All ${Name} Word Lists` };

  const crossLength = (kind: 'starting-with' | 'ending-in' | 'with', c: string): Link[] =>
    LENGTHS.filter((l) => l !== len)
      .filter((l) => {
        const f = familiesFor(l);
        const m =
          kind === 'starting-with' ? f.startingWith : kind === 'ending-in' ? f.endingIn : f.withLetter;
        return ok(m.get(c));
      })
      .map((l) => ({
        href: href(sectionFor(l), `${kind}-${c}`),
        label:
          kind === 'starting-with'
            ? `${l}-Letter Words Starting With ${up(c)}`
            : kind === 'ending-in'
              ? `${l}-Letter Words Ending in ${up(c)}`
              : `${l}-Letter Words With ${up(c)}`,
      }));

  const neighbours = (
    prefix: string,
    c: string,
    exists: (x: string) => boolean,
    text: (x: string) => string,
  ): Link[] => {
    const i = ALPHABET.indexOf(c);
    const out: Link[] = [];
    for (const d of [25, 1]) {
      const x = ALPHABET[(i + d) % 26];
      if (exists(x)) out.push({ href: href(section, `${prefix}${x}`), label: text(x) });
    }
    return out;
  };

  /* --- starting-with-X ------------------------------------------- */
  for (const c of ALPHABET) {
    const words = idx.startingWith.get(c);
    if (!ok(words)) continue;
    const copy: FamilyCopy = { phrase: `Starting With ${up(c)}`, phraseLower: `that start with ${up(c)}` };
    const groups: LinkGroup[] = [];
    if (len === 5) {
      const se = letterChips(section, `starting-with-${c}-ending-in-`, ALPHABET, (y) => ok(idx.startEnd.get(c + y)), (y) => `Ending in ${up(y)}`);
      if (se.length) groups.push({ heading: `${Name} words starting with ${up(c)}, by last letter`, links: se });
    }
    groups.push({
      heading: `Starting with ${up(c)} in other lengths`,
      links: crossLength('starting-with', c),
    });
    groups.push({
      heading: 'Related word lists',
      links: [
        ...neighbours('starting-with-', c, (x) => ok(idx.startingWith.get(x)), (x) => `${Name} Words Starting With ${up(x)}`),
        ...(ok(idx.endingIn.get(c)) ? [{ href: href(section, `ending-in-${c}`), label: `${Name} Words Ending in ${up(c)}` }] : []),
        ...(ok(idx.withLetter.get(c)) ? [{ href: href(section, `with-${c}`), label: `${Name} Words With ${up(c)}` }] : []),
        hub,
      ],
    });
    pages.push(buildPage(len, `starting-with-${c}`, `${Name} Words Starting With ${up(c)}`, copy, words, groups));
  }

  /* --- ending-in-X ------------------------------------------------ */
  for (const c of ALPHABET) {
    const words = idx.endingIn.get(c);
    if (!ok(words)) continue;
    const copy: FamilyCopy = { phrase: `Ending in ${up(c)}`, phraseLower: `that end in ${up(c)}` };
    const groups: LinkGroup[] = [];
    if (len === 5) {
      const se = ALPHABET.filter((x) => ok(idx.startEnd.get(x + c))).map((x) => ({
        href: href(section, `starting-with-${x}-ending-in-${c}`),
        label: `Starting with ${up(x)}`,
      }));
      if (se.length) groups.push({ heading: `${Name} words ending in ${up(c)}, by first letter`, links: se });
    }
    groups.push({
      heading: `Ending in ${up(c)} in other lengths`,
      links: crossLength('ending-in', c),
    });
    groups.push({
      heading: 'Related word lists',
      links: [
        ...neighbours('ending-in-', c, (x) => ok(idx.endingIn.get(x)), (x) => `${Name} Words Ending in ${up(x)}`),
        ...(ok(idx.startingWith.get(c)) ? [{ href: href(section, `starting-with-${c}`), label: `${Name} Words Starting With ${up(c)}` }] : []),
        ...(ok(idx.withLetter.get(c)) ? [{ href: href(section, `with-${c}`), label: `${Name} Words With ${up(c)}` }] : []),
        hub,
      ],
    });
    pages.push(buildPage(len, `ending-in-${c}`, `${Name} Words Ending in ${up(c)}`, copy, words, groups));
  }

  /* --- with-X (containing, lengths ≤ CONTAINS_MAX_LEN) ------------- */
  for (const c of ALPHABET) {
    const words = idx.withLetter.get(c);
    if (!ok(words)) continue;
    const copy: FamilyCopy = { phrase: `With ${up(c)}`, phraseLower: `with ${up(c)} in them` };
    const groups: LinkGroup[] = [];
    if (len === 5) {
      const pairLinks = ALPHABET.filter((y) => y !== c)
        .map((y) => (c < y ? c + y : y + c))
        .filter((key, i, arr) => arr.indexOf(key) === i && ok(idx.pairs.get(key)))
        .map((key) => ({
          href: href(section, `with-${key[0]}-and-${key[1]}`),
          label: `${up(key[0])} + ${up(key[1])}`,
        }));
      if (pairLinks.length)
        groups.push({ heading: `${Name} words with ${up(c)} and another letter`, links: pairLinks });
      const posLinks = [2, 3, 4]
        .filter((p) => ok(idx.positions.get(c + String(p))))
        .map((p) => ({
          href: href(section, `with-${c}-as-${ORDINALS[p - 1]}-letter`),
          label: `${up(c)} as the ${ORDINALS[p - 1]} letter`,
        }));
      if (posLinks.length) groups.push({ heading: `${up(c)} in a specific position`, links: posLinks });
    }
    groups.push({
      heading: 'Related word lists',
      links: [
        ...(ok(idx.startingWith.get(c)) ? [{ href: href(section, `starting-with-${c}`), label: `${Name} Words Starting With ${up(c)}` }] : []),
        ...(ok(idx.endingIn.get(c)) ? [{ href: href(section, `ending-in-${c}`), label: `${Name} Words Ending in ${up(c)}` }] : []),
        ...crossLength('with', c),
        hub,
      ],
    });
    pages.push(buildPage(len, `with-${c}`, `${Name} Words With ${up(c)} in Them`, copy, words, groups));
  }

  if (len !== 5) return pages;

  /* --- with-X-and-Y (5-letter only) -------------------------------- */
  for (let i = 0; i < 26; i++) {
    for (let j = i + 1; j < 26; j++) {
      const x = ALPHABET[i];
      const y = ALPHABET[j];
      const words = idx.pairs.get(x + y);
      if (!ok(words)) continue;
      const copy: FamilyCopy = {
        phrase: `With ${up(x)} and ${up(y)}`,
        phraseLower: `with ${up(x)} and ${up(y)} in them`,
      };
      const siblings = ALPHABET.filter((z) => z !== x && z !== y)
        .map((z) => (x < z ? x + z : z + x))
        .filter((key) => ok(idx.pairs.get(key)))
        .slice(0, 6)
        .map((key) => ({
          href: href(section, `with-${key[0]}-and-${key[1]}`),
          label: `5-Letter Words With ${up(key[0])} and ${up(key[1])}`,
        }));
      const groups: LinkGroup[] = [
        {
          heading: 'Related word lists',
          links: [
            { href: href(section, `with-${x}`), label: `5-Letter Words With ${up(x)}` },
            { href: href(section, `with-${y}`), label: `5-Letter Words With ${up(y)}` },
            ...siblings,
            hub,
          ],
        },
      ];
      pages.push(
        buildPage(len, `with-${x}-and-${y}`, `5-Letter Words With ${up(x)} and ${up(y)}`, copy, words, groups),
      );
    }
  }

  /* --- starting-with-X-ending-in-Y (5-letter only) ------------------ */
  for (const x of ALPHABET) {
    for (const y of ALPHABET) {
      const words = idx.startEnd.get(x + y);
      if (!ok(words)) continue;
      const copy: FamilyCopy = {
        phrase: `Starting With ${up(x)} and Ending in ${up(y)}`,
        phraseLower: `that start with ${up(x)} and end in ${up(y)}`,
      };
      const groups: LinkGroup[] = [
        {
          heading: 'Related word lists',
          links: [
            { href: href(section, `starting-with-${x}`), label: `5-Letter Words Starting With ${up(x)}` },
            { href: href(section, `ending-in-${y}`), label: `5-Letter Words Ending in ${up(y)}` },
            ...ALPHABET.filter((z) => z !== y && ok(idx.startEnd.get(x + z)))
              .slice(0, 5)
              .map((z) => ({
                href: href(section, `starting-with-${x}-ending-in-${z}`),
                label: `Starting With ${up(x)}, Ending in ${up(z)}`,
              })),
            hub,
          ],
        },
      ];
      pages.push(
        buildPage(
          len,
          `starting-with-${x}-ending-in-${y}`,
          `5-Letter Words Starting With ${up(x)} and Ending in ${up(y)}`,
          copy,
          words,
          groups,
        ),
      );
    }
  }

  /* --- with-X-as-Nth-letter (5-letter only) ------------------------- */
  for (const c of ALPHABET) {
    for (const p of [2, 3, 4]) {
      const words = idx.positions.get(c + String(p));
      if (!ok(words)) continue;
      const ord = ORDINALS[p - 1];
      const copy: FamilyCopy = {
        phrase: `With ${up(c)} as the ${ord[0].toUpperCase() + ord.slice(1)} Letter`,
        phraseLower: `with ${up(c)} as the ${ord} letter`,
      };
      const groups: LinkGroup[] = [
        {
          heading: 'Related word lists',
          links: [
            ...[2, 3, 4]
              .filter((q) => q !== p && ok(idx.positions.get(c + String(q))))
              .map((q) => ({
                href: href(section, `with-${c}-as-${ORDINALS[q - 1]}-letter`),
                label: `5-Letter Words With ${up(c)} as the ${ORDINALS[q - 1]} letter`,
              })),
            { href: href(section, `starting-with-${c}`), label: `5-Letter Words Starting With ${up(c)}` },
            ...(ok(idx.endingIn.get(c)) ? [{ href: href(section, `ending-in-${c}`), label: `5-Letter Words Ending in ${up(c)}` }] : []),
            { href: href(section, `with-${c}`), label: `5-Letter Words With ${up(c)}` },
            hub,
          ],
        },
      ];
      pages.push(
        buildPage(
          len,
          `with-${c}-as-${ord}-letter`,
          `5-Letter Words With ${up(c)} as the ${ord[0].toUpperCase() + ord.slice(1)} Letter`,
          copy,
          words,
          groups,
        ),
      );
    }
  }

  /* --- specials (5-letter only) ------------------------------------- */
  const words5 = WORD_LISTS[5];
  const specials: Array<{
    slug: string;
    h1: string;
    copy: FamilyCopy;
    filter: (w: string) => boolean;
    intro: string[];
  }> = [
    {
      slug: 'without-vowels',
      h1: '5-Letter Words Without Vowels',
      copy: { phrase: 'Without Vowels', phraseLower: 'with no vowels (A, E, I, O, U)' },
      filter: (w) => ![...w].some((ch) => VOWELS.has(ch)),
      intro: [
        'No A, E, I, O, or U — these five-letter words survive on consonants alone, usually with Y or W doing a vowel’s job. They are rare, surprising, and brutal to find in a puzzle unless you know they exist.',
        'Most of them lean on Y (as in LYMPH or CRYPT) or on Welsh borrowings like CRWTH. They are all valid tournament words, and they make devastating Scrabble plays when your rack is a wall of consonants.',
      ],
    },
    {
      slug: 'with-no-repeated-letters',
      h1: '5-Letter Words With No Repeated Letters',
      copy: { phrase: 'With No Repeated Letters', phraseLower: 'with five different letters' },
      filter: (w) => new Set(w).size === 5,
      intro: [
        'Every word here uses five different letters — the property that makes a perfect Wordle opener. Each guess tests five distinct letters of the alphabet instead of wasting a slot on a duplicate.',
        'The list is sorted by frequency, so the early entries are both common and information-rich. Pick two of them with no overlapping letters and you have tested ten letters in two moves.',
      ],
    },
    {
      slug: 'with-double-letters',
      h1: '5-Letter Words With Double Letters',
      copy: { phrase: 'With Double Letters', phraseLower: 'with a double letter' },
      filter: (w) => {
        for (let i = 0; i < w.length - 1; i++) if (w[i] === w[i + 1]) return true;
        return false;
      },
      intro: [
        'These five-letter words contain the same letter twice in a row — LL, SS, EE, OO and friends. Puzzle setters love them because most players are slow to consider repeats.',
        'If your yellow letters keep refusing every position you try, a double letter is often the trick. Scan the common words below before you burn another guess.',
      ],
    },
    {
      slug: 'with-four-vowels',
      h1: '5-Letter Words With Four Vowels',
      copy: { phrase: 'With Four Vowels', phraseLower: 'with four or more vowels' },
      filter: (w) => [...w].filter((ch) => VOWELS.has(ch)).length >= 4,
      intro: [
        'Four of the five letters in each of these words are vowels. Words like ADIEU, AUDIO, and QUEUE are famous Wordle openers precisely because they test almost every vowel at once.',
        'Vowel-heavy words are also rack-savers in Scrabble when you draw nothing but A, E, I, O, and U. All of these are tournament-legal.',
      ],
    },
    {
      slug: 'with-q-but-no-u',
      h1: '5-Letter Words With Q but No U',
      copy: { phrase: 'With Q but No U', phraseLower: 'with a Q but no U' },
      filter: (w) => w.includes('q') && !w.includes('u'),
      intro: [
        'The letter Q almost always drags a U along — except in these words. Most are borrowings: QOPH from Hebrew, QANAT from Persian, TRANQ from street English.',
        'They are lifesavers in Scrabble when the U never arrives, and a fun bit of trivia everywhere else. All entries are valid tournament words.',
      ],
    },
  ];
  for (const sp of specials) {
    const words = words5.filter(sp.filter);
    if (!ok(words)) continue;
    const groups: LinkGroup[] = [
      {
        heading: 'More special word lists',
        links: [
          ...specials
            .filter((o) => o.slug !== sp.slug && ok(words5.filter(o.filter)))
            .map((o) => ({ href: href(section, o.slug), label: o.h1 })),
          hub,
        ],
      },
    ];
    pages.push(buildPage(len, sp.slug, sp.h1, sp.copy, words, groups, { intro: sp.intro }));
  }

  return pages;
}

const pageCache = new Map<WordLength, PageDef[]>();

export function allPagesFor(len: WordLength): PageDef[] {
  let pages = pageCache.get(len);
  if (!pages) pageCache.set(len, (pages = buildAllPages(len)));
  return pages;
}

export function allPages(): PageDef[] {
  return LENGTHS.flatMap((len) => allPagesFor(len));
}

/* ------------------------------------------------------------------ */
/* Hub page data                                                       */
/* ------------------------------------------------------------------ */

export interface HubData {
  section: string;
  len: WordLength;
  h1: string;
  title: string;
  description: string;
  wordCount: number;
  groups: LinkGroup[];
}

export function hubFor(len: WordLength): HubData {
  const idx = familiesFor(len);
  const section = sectionFor(len);
  const Name = `${len}-Letter`;
  const groups: LinkGroup[] = [];

  const starting = letterChips(section, 'starting-with-', ALPHABET, (c) => ok(idx.startingWith.get(c)), up);
  if (starting.length) groups.push({ heading: `${Name} words starting with…`, links: starting });
  const ending = letterChips(section, 'ending-in-', ALPHABET, (c) => ok(idx.endingIn.get(c)), up);
  if (ending.length) groups.push({ heading: `${Name} words ending in…`, links: ending });
  const containing = letterChips(section, 'with-', ALPHABET, (c) => ok(idx.withLetter.get(c)), up);
  if (containing.length) groups.push({ heading: `${Name} words containing…`, links: containing });

  if (len === 5) {
    groups.push({
      heading: 'Popular letter combinations',
      links: ['ae', 'ao', 'ai', 'au', 'ei', 'eo', 'eu', 'io', 'ou', 'ar', 'er', 'or', 'an', 'en', 'in', 'on', 'at', 'et', 'it', 'st']
        .filter((key) => ok(idx.pairs.get(key)))
        .map((key) => ({
          href: href(section, `with-${key[0]}-and-${key[1]}`),
          label: `${up(key[0])} + ${up(key[1])}`,
        })),
    });
    groups.push({
      heading: 'Special lists',
      links: allPagesFor(5)
        .filter((p) =>
          ['without-vowels', 'with-no-repeated-letters', 'with-double-letters', 'with-four-vowels', 'with-q-but-no-u'].includes(p.slug),
        )
        .map((p) => ({ href: href(section, p.slug), label: p.h1 })),
    });
  }
  const count = formatCount(WORD_LISTS[len].length);
  return {
    section,
    len,
    h1: `${Name} Word Lists`,
    title: `${Name} Words — Lists by Starting Letter, Ending & Pattern`,
    description: `Every ${LENGTH_NAMES[len]}-letter word list in one place: ${count} words organised by starting letter, ending letter, and pattern, with Scrabble points. Free word finder included.`,
    wordCount: WORD_LISTS[len].length,
    groups,
  };
}
