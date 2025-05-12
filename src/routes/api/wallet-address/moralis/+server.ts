import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

const MORALIS_KEY = import.meta.env.VITE_MORALIS_API_KEY;
const MORALIS_URL = import.meta.env.VITE_MORALIS_API_URL;

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

  // Fetch token balances across chains in parallel
  const results = await Promise.all(
    CHAINS.map(async (chain) => {
      const endpoint = `${MORALIS_URL}/wallets/${address}/tokens?chain=${chain}`;
      try {
        const res = await fetch(endpoint, {
          headers: {
            Accept:      'application/json',
            'X-API-Key': MORALIS_KEY
          }
        });
        if (!res.ok) return [];
        const { result = [] } = await res.json();
        return result
          .filter((t: any) => t.balance && t.balance !== '0')
          .map((t: any) => ({
            chain,
            symbol:           t.symbol,
            contract_address: t.token_address,
            balance:          Number(t.balance) / 10 ** t.decimals
          }));
      } catch {
        return [];
      }
    })
  );

  const walletBalances = results.flat();

  // Persist snapshot for debugging
  const outDir  = path.resolve('src/data');
  const outFile = path.join(outDir, `${address}_wallet.json`);
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(walletBalances, null, 2), 'utf8');

  return json(walletBalances);
}
