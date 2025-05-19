import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

import fs from 'fs/promises';
import path from 'path';

interface CoinInfo {
  id: string;
  symbol: string;
}

interface WalletToken {
  chain: string;
  symbol: string;
  balance: number;
}

export async function GET({ url, fetch }: RequestEvent) {
  // 1) Load & index CoinGecko coin list from src/data/coins-list.json
  const coinsPath = path.resolve('src/data/coins-list.json');
  let coins: CoinInfo[];
  try {
    const raw = await fs.readFile(coinsPath, 'utf-8');
    coins = JSON.parse(raw);
  } catch (e) {
    console.error('Error loading coins-list.json:', e);
    throw error(500, 'Could not load coin list');
  }
  const symbolToId = new Map<string, string>();
  for (const { id, symbol } of coins) {
    symbolToId.set(symbol.toLowerCase(), id);
  }

  // 2) Get the address query param
  const address = url.searchParams.get('address');
  if (!address) throw error(400, 'Missing ?address');

  // 3) Fetch on-chain tokens from Moralis
  const moralisUrl = `/api/wallet-address/moralis?address=${encodeURIComponent(address)}`;
  const wRes = await fetch(moralisUrl);
  if (!wRes.ok) {
    const txt = await wRes.text();
    throw error(502, `Moralis error: ${txt}`);
  }
  const walletTokens = (await wRes.json()) as WalletToken[];

  // 4) Filter to only tokens CoinGecko knows about
  const matched = walletTokens.filter((t) =>
    symbolToId.has(t.symbol.toLowerCase())
  );
  if (!matched.length) {
    // Persist an empty portfolio if you want
    await fs.mkdir(path.resolve('src/data'), { recursive: true });
    await fs.writeFile(
      path.resolve('src/data', `${address}_portfolio.json`),
      JSON.stringify([], null, 2)
    );
    return json([]);
  }

  // 5) Fetch prices for those matched IDs
  const uniqueIds = Array.from(
    new Set(matched.map((t) => symbolToId.get(t.symbol.toLowerCase())!))
  );
  const priceRes = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
      uniqueIds.join(',')
    )}&vs_currencies=usd`
  );
  if (!priceRes.ok) {
    const txt = await priceRes.text();
    throw error(502, `Coingecko price error: ${txt}`);
  }
  const priceData = (await priceRes.json()) as Record<
    string,
    { usd: number }
  >;

  // 6) Build your final portfolio array
  const portfolio = matched.map((t) => {
    const id = symbolToId.get(t.symbol.toLowerCase())!;
    const price = priceData[id]?.usd ?? 0;
    return {
      chain: t.chain,
      symbol: t.symbol,
      balance: t.balance,
      price,
      totalValue: +(t.balance * price).toFixed(6)
    };
  });

  // 7) Persist to src/data/<address>_portfolio.json for inspection
  await fs.mkdir(path.resolve('src/data'), { recursive: true });
  await fs.writeFile(
    path.resolve('src/data', `${address}_portfolio.json`),
    JSON.stringify(portfolio, null, 2),
    'utf-8'
  );

  // 8) Return the filtered portfolio
  return json(portfolio);
}
