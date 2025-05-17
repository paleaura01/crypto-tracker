// src/routes/api/wallet-address/bitquery.ts
import type { RequestEvent } from '@sveltejs/kit';
import axios from 'axios';

const KEY = import.meta.env.VITE_BITQUERY_API_KEY as string;

export async function GET({ url }: RequestEvent): Promise<Response> {
  const address = url.searchParams.get('address') ?? '';
  const network = url.searchParams.get('network') ?? 'ethereum';

  const query = `
    query ($address: String!) {
      ${network}(network: ${network}) {
        address(address: { is: $address }) {
          balances {
            currency { symbol }
            value
            valueUSD
          }
        }
      }
    }`;

  const resp = await axios.post<{
    data: Record<string, { address?: Array<{ balances: Array<{ currency: { symbol: string }; value: number; valueUSD: number }> }> }>;
  }>(
    'https://graphql.bitquery.io/',
    { query, variables: { address } },
    { headers: { 'X-API-KEY': KEY } }
  );

  const balances = resp.data.data[network]?.address?.[0]?.balances || [];
  const result = balances.map(b => ({
    symbol:   b.currency.symbol,
    balance:  b.value,
    usdValue: b.valueUSD,
    network
  }));

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}
