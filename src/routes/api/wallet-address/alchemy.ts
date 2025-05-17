// src/routes/api/wallet-address/alchemy.ts
import type { RequestEvent } from '@sveltejs/kit';
import { Alchemy, Network }   from 'alchemy-sdk';
import type { TokenBalance }  from 'alchemy-sdk';

const alchemy = new Alchemy({
  apiKey:  import.meta.env.VITE_ALCHEMY_API_KEY as string,
  network: Network.ETH_MAINNET
});

export async function GET({ url }: RequestEvent): Promise<Response> {
  const address = url.searchParams.get('address') ?? '';

  // 1) fetch raw balances
  const [ethBalance, tokenRes] = await Promise.all([
    alchemy.core.getBalance(address),
    alchemy.core.getTokenBalances(address)
  ]);

  // build your “native” ETH entry
  const native = {
    symbol:   'ETH',
    balance:  Number(ethBalance) / 1e18,
    usdValue: null as number | null,
    network:  'ethereum'
  };

  // 2) enrich each ERC-20 balance with metadata
  const enriched = await Promise.all(
    (tokenRes.tokenBalances as TokenBalance[]).map(async (t) => {
      // skip errored tokens
      if (t.error) return null;

      const meta = await alchemy.core.getTokenMetadata(t.contractAddress);
      const decimals = meta.decimals ?? 0;
      const rawBalance = Number(t.tokenBalance) / 10 ** decimals;

      return {
        symbol:   meta.symbol,
        balance:  rawBalance,
        usdValue: null as number | null,   // ← you can fetch price here if desired
        network:  'ethereum'
      };
    })
  );

  // filter out any nulls
  const result = [ native, ...enriched.filter((x): x is NonNullable<typeof x> => !!x) ];

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}
