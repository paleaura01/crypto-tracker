// routes/api/cb/exchange/balances/+server.js
import { json } from '@sveltejs/kit';
import { fetchExchangeBalances } from '$lib/server/cb-exchange.js';

export async function GET () {
  try {
    const accounts = await fetchExchangeBalances();
    return json(accounts.filter(a => +a.available_balance.value > 0));
  } catch (e) {
    return json({ error:e.message }, { status:500 });
  }
}
