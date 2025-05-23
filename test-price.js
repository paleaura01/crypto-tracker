#!/usr/bin/env node
import fetch from 'node-fetch';

/**
 * Fetch the spot price of a given symbol from Coinbase public API v2.
 * @param {string} symbol – e.g. 'BTC-USD'
 * @returns {Promise<string>} – price as a string
 */
async function fetchSpotPrice(symbol = 'BTC-USD') {
  const res = await fetch(`https://api.coinbase.com/v2/prices/${symbol}/spot`);
  if (!res.ok) throw new Error(`Spot → ${res.status}: ${await res.text()}`);
  const { data: { amount } } = await res.json();
  return amount;
}

/**
 * Fetch the ticker from Coinbase Exchange API.
 * @param {string} symbol – e.g. 'BTC-USD'
 * @returns {Promise<{price: string, bid: string, ask: string}>}
 */
async function fetchExchangeTicker(symbol = 'BTC-USD') {
  const res = await fetch(`https://api.exchange.coinbase.com/products/${symbol}/ticker`);
  if (!res.ok) throw new Error(`Exchange → ${res.status}: ${await res.text()}`);
  const { price, bid, ask } = await res.json();
  return { price, bid, ask };
}

(async () => {
  try {
    console.log('Fetching via Spot Price API…');
    const spot = await fetchSpotPrice();
    console.log(`Spot Price BTC-USD: $${spot}`);

    console.log('\nFetching via Exchange Ticker API…');
    const { price, bid, ask } = await fetchExchangeTicker();
    console.log(`Last Trade Price: $${price}, Bid: $${bid}, Ask: $${ask}`);
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
})();
