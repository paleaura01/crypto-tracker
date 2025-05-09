// src/routes/api/wallet-address/alchemy.js
import { Alchemy, Network } from 'alchemy-sdk';
const settings = {
  apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET
};
const alchemy = new Alchemy(settings);
export async function GET({ url }) {
  const address = url.searchParams.get('address');
  const [bal, tokens] = await Promise.all([
    alchemy.core.getBalance(address),
    alchemy.core.getTokenBalances(address)
  ]);
  const native = {
    symbol: 'ETH',
    balance: Number(bal) / 1e18,
    usdValue: null,
    network: 'ethereum'
  };
  const tok = tokens.tokenBalances.map(t=>({
    symbol: t.contractTickerSymbol,
    balance: Number(t.tokenBalance)/10**t.contractDecimals,
    usdValue: t.tokenUsd,
    network: 'ethereum'
  }));
  return new Response(JSON.stringify([native, ...tok]));
}
