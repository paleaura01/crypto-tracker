// src/routes/api/wallet-address/moralis/+server.js
import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

const MORALIS_API_KEY = import.meta.env.VITE_MORALIS_API_KEY;
const MORALIS_BASE   = import.meta.env.VITE_MORALIS_API_URL;

const CHAINS = [
  'eth','polygon','bsc','fantom','cronos','avalanche',
  'gnosis','arbitrum','optimism','base','moonbase',
  'moonriver','ronin','pulse'
];

export async function GET({ url }) {
  const address = url.searchParams.get('address');
  if (!address) {
    return json({ error: 'Missing ?address' }, { status: 400 });
  }

  // 1) fetch balances across chains in parallel
  const results = await Promise.all(
    CHAINS.map(async (chain) => {
      const endpoint = `${MORALIS_BASE}/wallets/${address}/tokens?chain=${chain}`;
      try {
        const res = await fetch(endpoint, {
          headers: {
            Accept:      'application/json',
            'X-API-Key': MORALIS_API_KEY
          }
        });
        if (!res.ok) return [];
        const { result = [] } = await res.json();
        return result
          .filter(t => t.balance && t.balance !== '0')
          .map(t => ({
            chain,
            symbol:  t.symbol,
            balance: Number(t.balance) / 10 ** t.decimals
          }));
      } catch {
        return [];
      }
    })
  );

  const walletBalances = results.flat();

  // 2) dump to src/data/<address>_wallet.json
  const outDir  = path.resolve('src/data');
  const outFile = path.join(outDir, `${address}_wallet.json`);
  await fs.writeFile(outFile, JSON.stringify(walletBalances, null, 2), 'utf8');

  // 3) return it
  return json(walletBalances);
}
