import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';
import type { RequestHandler } from './$types';

const MORALIS_KEY = import.meta.env.VITE_MORALIS_API_KEY!;
const MORALIS_URL = import.meta.env.VITE_MORALIS_API_URL!;

// Define the shape of a Moralis token result
interface MoralisToken {
  symbol: string;
  token_address: string;
  balance: string;
  decimals: number;
}

const CHAINS = [
  'eth',
  'polygon',
  'bsc',
  'avalanche',
  'fantom',
  'cronos',
  'arbitrum',
  'optimism'
] as const;

export const GET: RequestHandler = async ({ url }) => {
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
  
  // Persist to file for debugging/caching in organized tmp directory
  try {
    const dataDir = path.join(process.cwd(), 'tmp', 'wallet-balances');
    // Ensure directory exists
    await fs.mkdir(dataDir, { recursive: true });
    const filename = `wallet-${address.slice(0, 6)}-${Date.now()}.json`;
    const filepath = path.join(dataDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify({
      address,
      timestamp: new Date().toISOString(),
      chains: CHAINS,
      balances: walletBalances
    }, null, 2));
    
  } catch {
    // Ignore save error
  }
  
  return json({
    address,
    chains: CHAINS,
    balances: walletBalances,
    total_tokens: walletBalances.length,
    timestamp: new Date().toISOString()
  });
}
