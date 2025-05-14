// src/routes/api/wallet-address/blockcypher.js
import axios from 'axios';
const TOKEN = import.meta.env.VITE_BLOCKCYPHER_TOKEN;
export async function GET({ url }) {
  const address = url.searchParams.get('address');
  const [btc, eth] = await Promise.all([
    axios.get(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`, { params:{ token:TOKEN }}),
    axios.get(`https://api.blockcypher.com/v1/eth/main/addrs/${address}/balance`, { params:{ token:TOKEN }})
  ]);
  return new Response(JSON.stringify([
    { symbol:'BTC', balance:btc.data.final_balance/1e8, usdValue:null, network:'bitcoin' },
    { symbol:'ETH', balance:eth.data.final_balance/1e18, usdValue:null, network:'ethereum' }
  ]));
}
