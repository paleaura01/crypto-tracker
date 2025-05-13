// src/routes/portfolio/+page.server.ts
export const csr = false;     // ← disable client rendering/hydration
export const ssr = true;      // ← keep server‐side rendering on

import type { PageServerLoad } from './$types';
import { fetchExchangeV2 }     from './lib/cbexchangev2';
import { fetchExchangeV3 }     from './lib/cbexchangev3';
import { fetchWalletBalances } from './lib/cbwallet';
import { fetchLoanData }       from './lib/cbloans';
import { error }               from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
  const [v2, v3, wallet, loan] = await Promise.allSettled([
    fetchExchangeV2(),
    fetchExchangeV3(),
    fetchWalletBalances(),
    fetchLoanData()
  ]);

  if (v2.status === 'rejected') throw error(500, `v2 error: ${v2.reason}`);
  if (v3.status === 'rejected') throw error(500, `v3 error: ${v3.reason}`);

  return {
    exchangeAccountsV2: v2.value,
    exchangeAccountsV3: v3.value,
    walletAccounts:     wallet.status === 'fulfilled' ? wallet.value : [],
    loan:               loan.status === 'fulfilled' ? loan.value : null
  };
};
