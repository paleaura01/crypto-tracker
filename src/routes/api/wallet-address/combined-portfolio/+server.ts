// src/routes/api/wallet-address/combined-portfolio/+server.ts
import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

const MORALIS_KEY = import.meta.env.VITE_MORALIS_API_KEY!;
const MORALIS_URL = import.meta.env.VITE_MORALIS_API_URL!;

// Chains you want to query
const CHAINS = ['eth','polygon','bsc'] as const;
type Chain = typeof CHAINS[number];

interface MoralisToken {
  symbol: string;
  token_address: string;
  balance: string;
  decimals: number;
}

export async function GET({ url }) {
  const address = url.searchParams.get('address');
  if (!address) {
    return json({ error: 'Missing ?address' }, { status: 400 });
  }

  console.log(`[combined-portfolio] fetching Moralis for ${address}`);

  // 1) Query all chains in parallel
  const results = await Promise.all(
    CHAINS.map(async (chain) => {
      const endpoint = `${MORALIS_URL}/wallets/${address}/tokens?chain=${chain}`;
      console.log(`[combined-portfolio] → GET ${endpoint}`);
      const res = await fetch(endpoint, {
        headers: { 
          Accept: 'application/json',
          'X-API-Key': MORALIS_KEY 
        }
      });
      if (!res.ok) {
        console.error(`[combined-portfolio] ${chain} failed: ${res.status}`);
        return [];
      }
      const body = await res.json();
      const tokens = Array.isArray(body.result) ? (body.result as MoralisToken[]) : [];
      console.log(`[combined-portfolio] ${chain} returned ${tokens.length} tokens`);

      return tokens
        .filter(t => t.balance !== '0')
        .map(t => ({
          chain,
          symbol: t.symbol,
          contract_address: t.token_address,
          balance: Number(t.balance) / 10 ** t.decimals
        }));
    })
  );

  const walletBalances = results.flat();
  console.log(`[combined-portfolio] total tokens: ${walletBalances.length}`);

  // 2) Persist into src/data/walletaddress_wallet.json for testing
  try {
    const filePath = path.resolve('src/data/walletaddress_wallet.json');
    await fs.writeFile(
      filePath,
      JSON.stringify(walletBalances, null, 2),
      'utf-8'
    );
    console.log(`[combined-portfolio] wrote ${walletBalances.length} entries to ${filePath}`);
  } catch (e) {
    console.error('[combined-portfolio] error writing JSON:', e);
  }

  // 3) Return the array
  return json(walletBalances);
}
