// src/routes/portfolio/+page.server.ts
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

import { fetchExchangeV2 } from '$lib/cbexchangev2';
import { fetchExchangeV3 } from '$lib/cbexchangev3';
import { fetchWalletBalances } from '$lib/cbwallet';
import { fetchLoanData } from '$lib/cbloans';

export const load: PageServerLoad = async () => {
  const [v2R, v3R, walletR, loanR] = await Promise.allSettled([
    fetchExchangeV2(),
    fetchExchangeV3(),
    fetchWalletBalances(),
    fetchLoanData()
  ]);

  if (v2R.status === 'rejected')
    throw error(500, `Exchange V2 error: ${v2R.reason}`);
  if (v3R.status === 'rejected')
    throw error(500, `Exchange V3 error: ${v3R.reason}`);

  return {
    exchangeV2: v2R.value,
    exchangeV3: v3R.value,
    walletAccounts: walletR.status === 'fulfilled' ? walletR.value : [],
    loan: loanR.status === 'fulfilled' ? loanR.value : null
  };
};
