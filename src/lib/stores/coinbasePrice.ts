// src/lib/stores/coinbasePrice.ts
import { writable } from 'svelte/store';

export const btcPrice = writable<number|null>(null);
let ws: WebSocket | null = null;

export function startBtcTicker() {
  if (ws) return; // already connected

  ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');

  ws.addEventListener('open', () => {
    ws!.send(JSON.stringify({
      type: 'subscribe',
      channels: [
        { name: 'ticker',   product_ids: ['BTC-USD'] },
        { name: 'heartbeat',product_ids: ['BTC-USD'] }
      ]
    }));
  });

  ws.addEventListener('message', (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      // heartbeat messages won’t have price, so guard:
      if (msg.type === 'ticker' && msg.price) {
        btcPrice.set(parseFloat(msg.price));
      }
    } catch {
      // ignore non-JSON frames
    }
  });

  ws.addEventListener('error', (_err) => {
    // Error handling could be added here if needed
  });

  ws.addEventListener('close', () => {
    ws = null;
    // reconnect after a short delay
    setTimeout(startBtcTicker, 3_000);
  });
}
