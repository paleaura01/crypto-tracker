// src/routes/api/wallet-address/bitquery.js
import axios from 'axios';
const KEY = import.meta.env.VITE_BITQUERY_API_KEY;
export async function GET({ url }) {
  const address = url.searchParams.get('address');
  const network = url.searchParams.get('network') || 'ethereum';
  const query = `
    query ($address: String!) {
      ${network}(network: ${network}) {
        address(address: {is: $address}) {
          balances {
            currency { symbol }
            value
            valueUSD
          }
        }
      }
    }`;
  const resp = await axios.post('https://graphql.bitquery.io/', {
    query, variables: { address }
  }, { headers: { 'X-API-KEY': KEY }});
  const balances = resp.data.data[network].address?.[0]?.balances || [];
  const result = balances.map(b => ({
    symbol: b.currency.symbol,
    balance: b.value,
    usdValue: b.valueUSD,
    network
  }));
  return new Response(JSON.stringify(result));
}
