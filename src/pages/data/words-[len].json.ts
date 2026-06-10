import type { APIRoute } from 'astro';
import { LENGTHS, WORD_LISTS, type WordLength } from '../../lib/words';

export function getStaticPaths() {
  return LENGTHS.map((len) => ({ params: { len: String(len) } }));
}

export const GET: APIRoute = ({ params }) => {
  const len = Number(params.len) as WordLength;
  return new Response(JSON.stringify(WORD_LISTS[len]), {
    headers: { 'Content-Type': 'application/json' },
  });
};
