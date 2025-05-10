// src/routes/api/coingecko-price/+server.js
import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price';
// e.g. ?ids=ethereum,polygon,bsc&vs_currencies=usd&include_symbol=true

// list all the symbols you care about:
const CG_IDS = [
  'ethereum','polygon-pos','binancecoin','fantom','cronos','avalanche-2',
  'gnosis','arbitrum-one','optimism','base','moonbeam','moonriver','ronin','pulsechain'
];

export async function GET() {
  const qs = new URLSearchParams({
    ids: CG_IDS.join(','),
    vs_currencies: 'usd',
    include_symbol: 'true'
  });
  const res = await fetch(`${COINGECKO_URL}?${qs}`);
  if (!res.ok) {
    return json({ error: 'Coingecko error' }, { status: res.status });
  }
  const priceMap = await res.json();

  // write to src/data/coingecko_prices.json
  const outDir  = path.resolve('src/data');
  const outFile = path.join(outDir, `coingecko_prices.json`);
  await fs.writeFile(outFile, JSON.stringify(priceMap, null, 2), 'utf8');

  return json(priceMap);
}
