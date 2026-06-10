import words4 from '../data/words-4.json';
import words5 from '../data/words-5.json';
import words6 from '../data/words-6.json';
import words7 from '../data/words-7.json';

export type WordLength = 4 | 5 | 6 | 7;

export const LENGTHS: WordLength[] = [4, 5, 6, 7];

/** Frequency-sorted (most common first) public-domain word lists. */
export const WORD_LISTS: Record<WordLength, string[]> = {
  4: words4 as string[],
  5: words5 as string[],
  6: words6 as string[],
  7: words7 as string[],
};

export const LENGTH_NAMES: Record<WordLength, string> = {
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
};

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

export const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

export function sectionFor(len: WordLength): string {
  return `${len}-letter-words`;
}

export function lengthForSection(section: string): WordLength | undefined {
  const m = section.match(/^([4-7])-letter-words$/);
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
