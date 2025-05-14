// src/routes/api/wallet-address/infura.js
import axios from 'axios';
const URL = import.meta.env.VITE_INFURA_URL;
export async function GET({ url }) {
  const address = url.searchParams.get('address');
  const resp = await axios.post(URL, {
    jsonrpc: '2.0', id: 1,
    method: 'eth_getBalance',
    params: [address, 'latest']
  });
  const balance = parseInt(resp.data.result, 16) / 1e18;
  return new Response(JSON.stringify([{
    symbol: 'ETH', balance, usdValue: null, network: 'ethereum'
  }]));
}
