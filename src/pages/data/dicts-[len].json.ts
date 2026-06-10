import type { APIRoute } from 'astro';
import { LENGTHS } from '../../lib/words';

import dicts2 from '../../data/dicts-2.json';
import dicts3 from '../../data/dicts-3.json';
import dicts4 from '../../data/dicts-4.json';
import dicts5 from '../../data/dicts-5.json';
import dicts6 from '../../data/dicts-6.json';
import dicts7 from '../../data/dicts-7.json';
import dicts8 from '../../data/dicts-8.json';
import dicts9 from '../../data/dicts-9.json';
import dicts10 from '../../data/dicts-10.json';
import dicts11 from '../../data/dicts-11.json';
import dicts12 from '../../data/dicts-12.json';
import dicts13 from '../../data/dicts-13.json';
import dicts14 from '../../data/dicts-14.json';
import dicts15 from '../../data/dicts-15.json';

const DICTS: Record<number, unknown> = {
  2: dicts2, 3: dicts3, 4: dicts4, 5: dicts5, 6: dicts6, 7: dicts7, 8: dicts8,
  9: dicts9, 10: dicts10, 11: dicts11, 12: dicts12, 13: dicts13, 14: dicts14, 15: dicts15,
};

export function getStaticPaths() {
  return LENGTHS.map((len) => ({ params: { len: String(len) } }));
}

export const GET: APIRoute = ({ params }) => {
  return new Response(JSON.stringify(DICTS[Number(params.len)]), {
    headers: { 'Content-Type': 'application/json' },
  });
};
