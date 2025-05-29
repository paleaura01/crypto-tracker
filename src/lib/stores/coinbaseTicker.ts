// src/lib/stores/coinbaseTicker.ts
import { writable } from 'svelte/store';

type PriceMap = Record<string, number>;
const prices = writable<PriceMap>({});
let ws: WebSocket | null = null;

/**
 * Subscribe to USD tickers for the given product IDs.
 * Reuses a single WS under the hood.
 */
export function startTicker(productIds: string[]) {
  if (!ws) {
    ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
    ws.addEventListener('message', (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'ticker' && msg.price && msg.product_id) {
          prices.update((p) => ({ ...p, [msg.product_id]: parseFloat(msg.price) }));
        }
      } catch {
        // ignore
      }
    });
    ws.addEventListener('close', () => {
      ws = null;
      setTimeout(() => startTicker(productIds), 3000);
    });
    ws.addEventListener('error', (_error) => {
      // Error handling could be added here if needed
    });
  }

  const subscribe = () => {
    ws!.send(
      JSON.stringify({
        type: 'subscribe',
        channels: [{ name: 'ticker', product_ids: productIds }]
      })
    );
  };

  if (ws.readyState === WebSocket.OPEN) {
    subscribe();
  } else {
    ws.addEventListener('open', subscribe, { once: true });
  }
}

export { prices };
