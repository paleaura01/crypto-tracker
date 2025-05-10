import { json } from '@sveltejs/kit';

const MORALIS_API_KEY = import.meta.env.VITE_MORALIS_API_KEY;
const MORALIS_BASE   = import.meta.env.VITE_MORALIS_API_URL;  // e.g. "https://deep-index.moralis.io/api/v2"

export async function GET({ url }) {
  const address = url.searchParams.get('address');
  let   chain   = url.searchParams.get('chain') || 'ethereum';

  if (!address) {
    return json({ error: 'Missing ?address' }, { status: 400 });
  }

  // remap our UI slug → Moralis slug
  if (chain === 'ethereum') {
    chain = 'eth';
  }

  // build the Moralis endpoint
  // use the “get wallet token balances with price” route:
  const endpoint = `${MORALIS_BASE}/wallets/${address}/tokens?chain=${chain}`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        Accept:      'application/json',
        'X-API-Key': MORALIS_API_KEY
      }
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error('Moralis API error:', res.status, txt);
      return json({ error: txt }, { status: res.status });
    }

    const payload  = await res.json();
    const tokens   = payload.result ?? [];

    const balances = tokens.map(t => ({
      symbol:   t.symbol,
      balance:  Number(t.balance) / 10 ** t.decimals,
      usdValue: t.quote != null ? Number(t.quote) : null
    }));

    return json(balances);

  } catch (err) {
    console.error('Moralis fetch error:', err);
    return json({ error: err.message }, { status: 502 });
  }
}
