// src/routes/api/wallet/wallet-address/infura.ts
import type { RequestEvent } from '@sveltejs/kit';
import axios from 'axios';

const URL = import.meta.env.VITE_INFURA_URL as string;

export async function GET({ url }: RequestEvent): Promise<Response> {
  const address = url.searchParams.get('address') ?? '';

  const resp = await axios.post<{ result: string }>(
    URL,
    {
      jsonrpc: '2.0',
      id:      1,
      method:  'eth_getBalance',
      params:  [address, 'latest']
    }
  );

  const balance = parseInt(resp.data.result, 16) / 1e18;
  const result = [{
    symbol:   'ETH',
    balance,
    usdValue: null as number | null,
    network:  'ethereum'
  }];

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}
