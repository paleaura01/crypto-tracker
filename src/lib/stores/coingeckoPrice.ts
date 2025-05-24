// src/lib/stores/coingeckoPrice.ts
import { writable, type Readable } from 'svelte/store';

interface PriceMap { [symbol: string]: number; }
const API = 'https://api.coingecko.com/api/v3/simple/price';

function createCoingeckoStore() {
  const { subscribe, set } = writable<PriceMap>({});
  let symbols: string[] = [];
  let timer: ReturnType<typeof setInterval>;

  async function fetchPrices() {
    if (!symbols.length) return;
    // CoinGecko wants IDs, so lowercase & comma-join
    const ids = symbols.map(s => s.toLowerCase()).join(',');
    const url = `${API}?ids=${ids}&vs_currencies=usd`;
    try {
      const data = await fetch(url).then(r => r.json()) as Record<string, { usd: number }>;
      const out: PriceMap = {};
      for (const id of Object.keys(data)) {
        out[id.toUpperCase()] = data[id].usd;
      }
      set(out);
    } catch (e) {
      console.error('Coingecko fetch failed', e);
    }
  }

  return {
    subscribe,
    start(newSyms: string[]) {
      symbols = newSyms;
      fetchPrices();
      clearInterval(timer);
      timer = setInterval(fetchPrices, 60_000);
    }
  } as Readable<PriceMap> & { start: (syms: string[]) => void };
}

export const coingeckoPrices = createCoingeckoStore();
