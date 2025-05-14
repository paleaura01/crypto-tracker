// src/routes/api/wallet-address/graph.js
import axios from 'axios';
const KEY = import.meta.env.VITE_GRAPH_API_KEY;
export async function GET({ url }) {
  const address = url.searchParams.get('address');
  const resp = await axios.get(`https://token-api.thegraph.com/balances/evm/${address}`, {
    headers:{ Authorization:`Bearer ${KEY}` },
    params:{ network_id:'mainnet', limit:1000 }
  });
  const data = resp.data.data || [];
  const result = data.map(i=>({
    symbol:i.symbol,
    balance: Number(i.amount)/10**i.decimals,
    usdValue: i.value_usd,
    network: i.network_id
  }));
  return new Response(JSON.stringify(result));
}
