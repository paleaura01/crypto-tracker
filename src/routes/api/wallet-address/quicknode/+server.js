// src/routes/api/wallet-address/quicknode/+server.js
import { Core } from '@quicknode/sdk';

const ENDPOINT_URL = import.meta.env.VITE_QUICKNODE_URL;

export async function GET({ url }) {
  const address = url.searchParams.get('address');
  if (!address) {
    return new Response(JSON.stringify({ error: 'Missing ?address' }), { status: 400 });
  }

  // Make sure you have the Token & NFT API v2 bundle installed in your dashboard,
  // and enable it here so we can call qn_getWalletTokenBalance.
  const core = new Core({
    endpointUrl: ENDPOINT_URL,
    config: { addOns: { nftTokenV2: true } }
  });

  try {
    // 1) Native ETH balance via JSON-RPC → getBalance() :contentReference[oaicite:0]{index=0}
    const nativeWei = await core.client.getBalance({ address });
    const nativeBal = Number(nativeWei) / 10 ** 18;

    // 2) ERC-20 token balances
    const { result: tokens } = await core.client.qn_getWalletTokenBalance({
      wallet:  address,
      perPage: 1000
    });

    // 3) Normalize & filter
    const tokenBalances = tokens
      .filter(t => t.totalBalance && t.totalBalance !== '0')
      .map(t => ({
        symbol:   t.symbol,
        balance:  Number(t.totalBalance) / 10 ** t.decimals,
        usdValue: t.quote != null ? Number(t.quote) : null
      }));

    // 4) Build final array: ETH first (if >0), then tokens
    const balances = [];
    if (nativeBal > 0) {
      balances.push({ symbol: 'ETH', balance: nativeBal, usdValue: null });
    }
    balances.push(...tokenBalances);

    return new Response(JSON.stringify(balances), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('QuickNode SDK error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 502 });
  }
}
