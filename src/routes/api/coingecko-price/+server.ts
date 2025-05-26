import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

const CG_BASE = import.meta.env.VITE_COINGECKO_BASE!;

interface TokenPayload {
  tokens: unknown;
}
interface Token {
  chain: string;
  contract_address: string;
}

const PLATFORM: Record<string, string> = {
  eth: 'ethereum',
  bsc: 'binance-smart-chain',
  polygon: 'polygon-pos',
  avalanche: 'avalanche',
  fantom: 'fantom',
  cronos: 'cronos',
  arbitrum: 'arbitrum-one',
  optimism: 'optimism'
};

export async function POST({ request }) {
  // 1) Safely parse & validate tokens[]
  const body = (await request.json()) as TokenPayload;
  const arr = Array.isArray(body.tokens) ? body.tokens : [];
  const tokens: Token[] = arr.filter((t): t is Token => 
    typeof t === 'object' &&
    t !== null &&
    typeof (t as any).chain === 'string' &&
    typeof (t as any).contract_address === 'string'
  );

  if (tokens.length === 0) {
    return json({ error: 'No tokens provided' }, { status: 400 });
  }

  // 2) Group addresses by platform
  const byPlatform = tokens.reduce<Record<string, Set<string>>>((acc, t) => {
    const p = PLATFORM[t.chain];
    if (!p) return acc;
    (acc[p] ||= new Set()).add(t.contract_address.toLowerCase());
    return acc;
  }, {});

  // 3) Fetch prices for each platform
  const fetches = Object.entries(byPlatform).map(async ([platform, addrs]) => {
    const url = `${CG_BASE}/simple/token_price/${platform}` +
                `?contract_addresses=${Array.from(addrs).join(',')}` +
                `&vs_currencies=usd`;
    const res = await fetch(url);
    return res.ok ? (await res.json() as Record<string, { usd: number }>) : {};
  });

  const maps = await Promise.all(fetches);
  const merged = Object.assign({}, ...maps);

  // Persist for debugging
  const outDir  = path.resolve('static/data');
  const outFile = path.join(outDir, `coingecko_token_prices.json`);
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(merged, null, 2), 'utf8');

  return json(merged);
}
