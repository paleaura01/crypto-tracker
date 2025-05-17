// src/routes/api/wallet-address/graph.ts
import type { RequestEvent } from '@sveltejs/kit';
import axios from 'axios';

const KEY = import.meta.env.VITE_GRAPH_API_KEY as string;

export async function GET({ url }: RequestEvent): Promise<Response> {
  const address = url.searchParams.get('address') ?? '';

  const resp = await axios.get<{
    data: Array<{ symbol: string; amount: string; decimals: number; value_usd: number; network_id: string }>;
  }>(
    `https://token-api.thegraph.com/balances/evm/${address}`,
    {
      headers: { Authorization: `Bearer ${KEY}` },
      params: { network_id: 'mainnet', limit: 1000 }
    }
  );

  const data = resp.data.data || [];
  const result = data.map(i => ({
    symbol:   i.symbol,
    balance:  Number(i.amount) / 10 ** i.decimals,
    usdValue: i.value_usd,
    network:  i.network_id
  }));

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}
