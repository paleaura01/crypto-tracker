// src/routes/api/combined-portfolio/+server.js
import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR        = path.resolve('src/data');
const COINSLIST_FILE  = path.join(DATA_DIR, 'coins-list.json');
const PRICECACHE_FILE = path.join(DATA_DIR, 'coingecko_prices.json');

async function ensureCoinsList() {
  try {
    await fs.access(COINSLIST_FILE);
  } catch {
    const res = await fetch('https://api.coingecko.com/api/v3/coins/list');
    if (!res.ok) throw new Error('Failed fetching coin list');
    const list = await res.json();
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(COINSLIST_FILE, JSON.stringify(list, null, 2));
  }
  return JSON.parse(await fs.readFile(COINSLIST_FILE, 'utf8'));
}

export async function GET({ url, fetch }) {
  const address = url.searchParams.get('address');
  if (!address) return json({ error: 'Missing ?address' }, { status: 400 });

  // 1) Load and map coin list
  const coinsList = await ensureCoinsList();
  const symbolToId = coinsList.reduce((map, { id, symbol }) => {
    if (symbol) map[symbol.toUpperCase()] = id;
    return map;
  }, {});

  // 2) Fetch wallet balances from Moralis
  const wRes = await fetch(`/api/wallet-address/moralis?address=${address}`);
  if (!wRes.ok) {
    const txt = await wRes.text();
    return json({ error: `Wallet API error: ${txt}` }, { status: 502 });
  }
  const walletBalances = await wRes.json();
  // → [ { chain, symbol, balance }, … ]

  // 3) Match symbols to Coingecko IDs
  const matched = walletBalances
    .map(b => ({
      symbol:  b.symbol.toUpperCase(),
      id:      symbolToId[b.symbol.toUpperCase()],
      balance: b.balance,
      chain:   b.chain
    }))
    .filter(x => x.id);

  const ids = Array.from(new Set(matched.map(x => x.id)));
  if (!ids.length) {
    // clear cache if no matches
    await fs.writeFile(PRICECACHE_FILE, JSON.stringify({}, null, 2), 'utf8');
    return json([]);
  }

  // 4) Fetch all prices in one go
  const pRes = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`
  );
  if (!pRes.ok) {
    const txt = await pRes.text();
    return json({ error: `Price fetch error: ${txt}` }, { status: 502 });
  }
  const priceData = await pRes.json();
  // → { ethereum:{usd:…}, matic-network:{usd:…}, … }

  // 5) Build a **sorted** symbol→{id,usd} cache and persist it
  const symbolPriceMap = {};
  for (const { symbol, id } of matched) {
    const usd = priceData[id]?.usd;
    if (usd != null) symbolPriceMap[symbol] = { id, usd };
  }
  const sortedSymbols = Object.keys(symbolPriceMap).sort();
  const sortedCache = {};
  for (const sym of sortedSymbols) {
    sortedCache[sym] = symbolPriceMap[sym];
  }
  await fs.writeFile(
    PRICECACHE_FILE,
    JSON.stringify(sortedCache, null, 2),
    'utf8'
  );

  // 6) Combine balances + prices, then **sort** by symbol
  const combined = matched
    .map(({ symbol, chain, balance }) => {
      const { usd } = sortedCache[symbol];
      return {
        symbol,
        chain,
        balance,
        price:      usd,
        totalValue: Number((balance * usd).toFixed(8))
      };
    })
    .filter(x => x.price != null)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  return json(combined);
}
