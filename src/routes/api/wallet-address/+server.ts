import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

const MORALIS_KEY = import.meta.env.VITE_MORALIS_API_KEY!;
const MORALIS_URL = import.meta.env.VITE_MORALIS_API_URL!;

// Define the shape of a Moralis token result
interface MoralisToken {
  symbol: string;
  token_address: string;
  balance: string;
  decimals: number;
}

const CHAINS = [ /* ... */ ] as const;
type Chain = typeof CHAINS[number];

export async function GET({ url }) {
  const address = url.searchParams.get('address');
  if (!address) return json({ error: 'Missing ?address' }, { status: 400 });

  const results = await Promise.all(
    CHAINS.map(async (chain) => {
      const endpoint = `${MORALIS_URL}/wallets/${address}/tokens?chain=${chain}`;
      const res = await fetch(endpoint, {
        headers: { Accept: 'application/json', 'X-API-Key': MORALIS_KEY }
      });
      if (!res.ok) return [];

      // Cast raw JSON to known interface
      const { result } = (await res.json()) as { result: unknown };
      const tokens = Array.isArray(result) ? (result as MoralisToken[]) : [];

      return tokens
        .filter((t) => t.balance !== '0')
        .map((t) => ({
          chain,
          symbol: t.symbol,
          contract_address: t.token_address,
          balance: Number(t.balance) / 10 ** t.decimals
        }));
    })
  );

  const walletBalances = results.flat();
  // ...persist and return as before...
  return json(walletBalances);
}
