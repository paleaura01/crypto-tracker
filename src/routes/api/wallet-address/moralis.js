// src/routes/api/wallet-address/moralis.js
import axios from 'axios';
const KEY = import.meta.env.VITE_MORALIS_API_KEY;
export async function GET({ url }) {
  const address = url.searchParams.get('address');
  const chain = url.searchParams.get('chain') || 'eth';
  const [native, tokens] = await Promise.all([
    axios.get(`https://deep-index.moralis.io/api/v2/${address}/balance`, {
      params: { chain }, headers: { 'X-API-Key': KEY }
    }),
    axios.get(`https://deep-index.moralis.io/api/v2/${address}/erc20`, {
      params: { chain }, headers: { 'X-API-Key': KEY }
    })
  ]);
  const nativeBal = {
    symbol: chain.toUpperCase(),
    balance: Number(native.data.balance) / 1e18,
    usdValue: null,
    network: chain
  };
  const erc20 = tokens.data.map(t => ({
    symbol: t.symbol,
    balance: Number(t.balance) / 10 ** t.decimals,
    usdValue: t.quote,
    network: chain
  }));
  return new Response(JSON.stringify([nativeBal, ...erc20]));
}
