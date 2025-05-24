// src/routes/api/wallet-address/combined-portfolio/+server.ts
import type { RequestHandler } from './$types';
import axios from 'axios';

const MORALIS_KEY = import.meta.env.VITE_MORALIS_API_KEY!;
const MORALIS_URL = import.meta.env.VITE_MORALIS_API_URL!;
const CHAINS = ['eth', 'polygon', 'bsc'] as const;
type Chain = typeof CHAINS[number];

interface MoralisToken {
  symbol: string;
  token_address: string;
  balance: string;
  decimals: number;
}

export const GET: RequestHandler = async ({ url }) => {
  const address = url.searchParams.get('address');
  if (!address) {
    return new Response(JSON.stringify({ error: 'Missing ?address' }), { status: 400 });
  }

  try {
    const perChain = await Promise.all(
      CHAINS.map(async (chain) => {
        const res = await axios.get<{ result: unknown }>(
          `${MORALIS_URL}/wallets/${address}/tokens?chain=${chain}`,
          { headers: { 'X-API-Key': MORALIS_KEY } }
        );
        const raw = res.data.result;
        if (!Array.isArray(raw)) return [];
        return (raw as MoralisToken[])
          .filter((t) => t.balance !== '0')
          .map((t) => ({
            symbol:   t.symbol,
            balance:  Number(t.balance) / 10 ** t.decimals
          }));
      })
    );

    const walletBalances = perChain.flat();
    return new Response(JSON.stringify(walletBalances), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('[combined-portfolio]', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Fetch failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
