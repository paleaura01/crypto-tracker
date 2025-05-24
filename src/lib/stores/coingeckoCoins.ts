// src/lib/stores/coingeckoCoins.ts
import { writable } from 'svelte/store';
import type { Readable } from 'svelte/store';

interface CoinInfo {
  id: string;
  symbol: string;
  name: string;
}

export function createCoinGeckoMap(): Readable<Record<string,string>> {
  const { subscribe, set } = writable<Record<string,string>>({});

  async function init() {
    const res = await fetch('https://api.coingecko.com/api/v3/coins/list');
    const list: CoinInfo[] = await res.json();
    // Build map SYMBOL (upper) → id
    const map: Record<string,string> = {};
    for (const c of list) {
      map[c.symbol.toUpperCase()] = c.id;
    }
    set(map);
  }

  init();
  return { subscribe };
}

export const symbolToCGId = createCoinGeckoMap();
