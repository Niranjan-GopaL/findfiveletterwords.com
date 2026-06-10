import words2 from '../data/words-2.json';
import words3 from '../data/words-3.json';
import words4 from '../data/words-4.json';
import words5 from '../data/words-5.json';
import words6 from '../data/words-6.json';
import words7 from '../data/words-7.json';
import words8 from '../data/words-8.json';
import words9 from '../data/words-9.json';
import words10 from '../data/words-10.json';
import words11 from '../data/words-11.json';
import words12 from '../data/words-12.json';
import words13 from '../data/words-13.json';
import words14 from '../data/words-14.json';
import words15 from '../data/words-15.json';

export type WordLength = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export const LENGTHS: WordLength[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

/** Frequency-sorted (most common first) tournament word lists (ENABLE ∪ TWL). */
export const WORD_LISTS: Record<WordLength, string[]> = {
  2: words2 as string[],
  3: words3 as string[],
  4: words4 as string[],
  5: words5 as string[],
  6: words6 as string[],
  7: words7 as string[],
  8: words8 as string[],
  9: words9 as string[],
  10: words10 as string[],
  11: words11 as string[],
  12: words12 as string[],
  13: words13 as string[],
  14: words14 as string[],
  15: words15 as string[],
};

export const LENGTH_NAMES: Record<WordLength, string> = {
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
  11: 'eleven',
  12: 'twelve',
  13: 'thirteen',
  14: 'fourteen',
  15: 'fifteen',
};

/** Lengths that get the heavyweight "with-X" (containing) page family. */
export const CONTAINS_MAX_LEN = 7;

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

export const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

export const SCRABBLE_POINTS: Record<string, number> = {
  a: 1, b: 3, c: 3, d: 2, e: 1, f: 4, g: 2, h: 4, i: 1, j: 8, k: 5, l: 1, m: 3,
  n: 1, o: 1, p: 3, q: 10, r: 1, s: 1, t: 1, u: 1, v: 4, w: 4, x: 8, y: 4, z: 10,
};

export const WWF_POINTS: Record<string, number> = {
  a: 1, b: 4, c: 4, d: 2, e: 1, f: 4, g: 3, h: 3, i: 1, j: 10, k: 5, l: 2, m: 4,
  n: 2, o: 1, p: 4, q: 10, r: 1, s: 1, t: 1, u: 2, v: 5, w: 4, x: 8, y: 3, z: 10,
};

export function scrabbleScore(word: string): number {
  let score = 0;
  for (const ch of word) score += SCRABBLE_POINTS[ch] ?? 0;
  return score;
}

export function sectionFor(len: WordLength): string {
  return `${len}-letter-words`;
}

export function lengthForSection(section: string): WordLength | undefined {
  const m = section.match(/^(1[0-5]|[2-9])-letter-words$/);
  return m ? (Number(m[1]) as WordLength) : undefined;
}

/** Comma-joined, uppercased preview of the most common words. */
export function topWords(words: string[], n = 3): string {
  return words
    .slice(0, n)
    .map((w) => w.toUpperCase())
    .join(', ');
}

export function formatCount(n: number): string {
  return n.toLocaleString('en-US');
}
