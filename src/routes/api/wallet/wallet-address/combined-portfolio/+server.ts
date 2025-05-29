import type { RequestHandler } from './$types';
import axios from 'axios';

const MORALIS_KEY = import.meta.env.VITE_MORALIS_API_KEY!;
const MORALIS_URL = import.meta.env.VITE_MORALIS_API_URL!;
const CHAINS = ['eth', 'polygon', 'bsc'] as const;

interface MoralisToken {
  chain: string;
  symbol: string;
  token_address: string;
  balance: string;
  decimals: number;
  // Moralis can also return name, logo, etc.
}

export const GET: RequestHandler = async ({ url }) => {
  const address = url.searchParams.get('address');
  if (!address) {
    return new Response(JSON.stringify({ error: 'Missing ?address' }), { status: 400 });
  }

  try {
    // fetch balances from all EVM chains
    const all = (
      await Promise.all(
        CHAINS.map(async (chain) => {
          const res = await axios.get<{ result: MoralisToken[] }>(
            `${MORALIS_URL}/wallets/${address}/tokens?chain=${chain}`,
            { headers: { 'X-API-Key': MORALIS_KEY } }
          );
          return (res.data.result || []).map((t) => ({
            symbol:           t.symbol,
            balance:          Number(t.balance) / 10 ** t.decimals,
            contract_address: t.token_address,
            chain
          }));
        })
      )
    ).flat();

    return new Response(JSON.stringify(all), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ error: message || 'Fetch failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
