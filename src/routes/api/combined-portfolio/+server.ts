import { json, error } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

export async function GET({ url, fetch }) {
  const address = url.searchParams.get('address');
  if (!address) {
    return json({ error: 'Missing ?address' }, { status: 400 });
  }

  // 1) Fetch on-chain balances from Moralis
  const moralisUrl = new URL('/api/wallet-address/moralis', url);
  moralisUrl.searchParams.set('address', address);
  const walletRes = await fetch(moralisUrl.href);
  if (!walletRes.ok) throw error(walletRes.status, 'Moralis fetch failed');
  const walletBalances = await walletRes.json() as Array<{
    chain: string;
    symbol: string;
    contract_address: string;
    balance: number;
  }>;

  // 2) Fetch USD prices for those tokens
  const priceRes = await fetch('/api/coingecko-price', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokens: walletBalances })
  });
  if (!priceRes.ok) throw error(priceRes.status, 'Price fetch failed');
  const priceMap = await priceRes.json() as Record<string, { usd: number }>;

  // 3) Merge & filter only tokens with a USD price
  const portfolio = walletBalances
    .map(t => {
      const priceObj = priceMap[t.contract_address.toLowerCase()];
      if (!priceObj) return null;
      const price = priceObj.usd;
      return {
        chain:      t.chain,
        symbol:     t.symbol,
        balance:    t.balance,
        price,
        totalValue: +(t.balance * price).toFixed(8)
      };
    })
    .filter((x): x is { chain: string; symbol: string; balance: number; price: number; totalValue: number } => x !== null);

  // 4) Persist snapshot
  const outDir  = path.resolve('src/data');
  const outFile = path.join(outDir, `${address}_portfolio.json`);
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(portfolio, null, 2), 'utf8');

  return json(portfolio);
}
