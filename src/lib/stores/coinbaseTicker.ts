// src/lib/stores/coinbaseTicker.ts
import { writable } from 'svelte/store';

type PriceMap = Record<string, number>;
const prices = writable<PriceMap>({});

let ws: WebSocket | null = null;

/**
 * Start (or reuse) a single WS connection and subscribe
 * to the given product-ids (e.g. [ 'BTC-USD', 'ETH-USD' ]).
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
        /* ignore */
      }
    });
    ws.addEventListener('close', () => {
      ws = null;
      // Reconnect after a bit…
      setTimeout(() => startTicker(productIds), 3000);
    });
    ws.addEventListener('error', console.error);
  }

  // Once open (or immediately if already open), send subscribe
  const subscribe = () => {
    ws!.send(JSON.stringify({
      type: 'subscribe',
      channels: [{ name: 'ticker', product_ids: productIds }]
    }));
  };

  if (ws.readyState === WebSocket.OPEN) {
    subscribe();
  } else {
    ws.addEventListener('open', subscribe, { once: true });
  }
}

export { prices };
