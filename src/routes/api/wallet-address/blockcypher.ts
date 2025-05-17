// src/routes/api/wallet-address/blockcypher.ts
import type { RequestEvent } from '@sveltejs/kit';
import axios from 'axios';

const TOKEN = import.meta.env.VITE_BLOCKCYPHER_TOKEN as string;

export async function GET({ url }: RequestEvent): Promise<Response> {
  const address = url.searchParams.get('address') ?? '';

  const [btcRes, ethRes] = await Promise.all([
    axios.get<{ final_balance: number }>(
      `https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`,
      { params: { token: TOKEN } }
    ),
    axios.get<{ final_balance: number }>(
      `https://api.blockcypher.com/v1/eth/main/addrs/${address}/balance`,
      { params: { token: TOKEN } }
    )
  ]);

  const result = [
    {
      symbol:   'BTC',
      balance:  btcRes.data.final_balance / 1e8,
      usdValue: null as number | null,
      network:  'bitcoin'
    },
    {
      symbol:   'ETH',
      balance:  ethRes.data.final_balance / 1e18,
      usdValue: null as number | null,
      network:  'ethereum'
    }
  ];

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}
