// src/routes/api/wallet-address/coinbase.js
import axios from 'axios';
const TOKEN = import.meta.env.VITE_COINBASE_OAUTH_TOKEN;
export async function GET() {
  const resp = await axios.get('https://api.coinbase.com/v2/accounts', {
    headers: { Authorization:`Bearer ${TOKEN}` }
  });
  const list = resp.data.data.map(acc=>({
    symbol: acc.balance.currency,
    balance: Number(acc.balance.amount),
    usdValue: acc.native_balance?.amount ?? null,
    network: 'coinbase'
  }));
  return new Response(JSON.stringify(list));
}
