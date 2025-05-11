// routes/portfolio/+page.server.js
import { error } from '@sveltejs/kit';
import { fetchExchangeBalances } from '$lib/server/cb-exchange.js';
import { fetchWalletBalances   } from '$lib/server/cb-wallet.js';

export async function load () {
  // run in parallel
  const [exch, wallet] = await Promise.allSettled([
    fetchExchangeBalances(),
    fetchWalletBalances()
  ]);

  if (exch.status === 'rejected')
    throw error(500, `Exchange: ${exch.reason.message}`);
  if (wallet.status === 'rejected')
    console.warn('[portfolio] wallet fetch failed →', wallet.reason.message);

  return {
    exchangeAccounts : exch.value,
    walletAccounts   : wallet.status === 'fulfilled' ? wallet.value : []
  };
}
