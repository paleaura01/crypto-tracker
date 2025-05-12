import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

const CG_BASE = import.meta.env.VITE_COINGECKO_BASE;

// Map Moralis chain names to CoinGecko platform IDs
const PLATFORM: Record<string, string> = {
  eth:       'ethereum',
  bsc:       'binance-smart-chain',
  polygon:   'polygon-pos',
  avalanche: 'avalanche',
  fantom:    'fantom',
  cronos:    'cronos',
  arbitrum:  'arbitrum-one',
  optimism:  'optimism'
};

export async function POST({ request }) {
  const { tokens } = await request.json() as { tokens: { chain: string; contract_address: string }[] };
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return json({ error: 'No tokens provided' }, { status: 400 });
  }

  // Group contract addresses by platform
  const byPlatform = tokens.reduce((acc, t) => {
    const p = PLATFORM[t.chain];
    if (!p) return acc;
    (acc[p] ||= new Set()).add(t.contract_address.toLowerCase());
    return acc;
  }, {} as Record<string, Set<string>>);

  // Fetch prices in parallel per platform
  const priceFetches = Object.entries(byPlatform).map(
    async ([platform, addrs]) => {
      const url = `${CG_BASE}/simple/token_price/${platform}` +
                  `?contract_addresses=${Array.from(addrs).join(',')}` +
                  `&vs_currencies=usd`;
      const res = await fetch(url);
      return res.ok ? await res.json() : {};
    }
  );

  const maps = await Promise.all(priceFetches);
  const merged = Object.assign({}, ...maps);

  // Persist for debugging
  const outDir  = path.resolve('src/data');
  const outFile = path.join(outDir, `coingecko_token_prices.json`);
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(merged, null, 2), 'utf8');

  return json(merged);
}
