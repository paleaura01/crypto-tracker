// routes/api/cb/wallet/balances/+server.js
import { json } from '@sveltejs/kit';
import { fetchWalletBalances } from '$lib/server/cb-wallet.js';

export async function GET () {
  try {
    const accounts = await fetchWalletBalances();
    return json(accounts.filter(a => +a.balance.amount > 0));
  } catch (e) {
    return json({ error:e.message }, { status:500 });
  }
}
