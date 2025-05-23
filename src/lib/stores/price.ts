// src/lib/stores/price.ts
import { writable } from 'svelte/store';

// start as null, not 0
export const btcPrice = writable<number | null>(null);

// track websocket or null
let ws: WebSocket | null = null;

export function startBtcTicker() {
  if (ws) return;

  // use the current Coinbase WS feed
  ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');

  ws.addEventListener('open', () => {
    ws!.send(
      JSON.stringify({
        type: 'subscribe',
        product_ids: ['BTC-USD'],
        channels: ['ticker']
      })
    );
  });

  ws.addEventListener('message', (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      if (msg.type === 'ticker' && msg.price) {
        btcPrice.set(parseFloat(msg.price));
      }
    } catch {
      // ignore
    }
  });

  ws.addEventListener('close', () => {
    ws = null;
    // try to reconnect after 5s
    setTimeout(startBtcTicker, 5_000);
  });
}
