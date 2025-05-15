import type { PageServerLoad } from './$types';
import {
  fetchExchangeV2,
  fetchExchangeV3,
  fetchWalletBalances,
  fetchLoanData
} from '$lib/services/coinbaseClient';

export const load: PageServerLoad = async () => {
  return {
    v2:     await fetchExchangeV2(),
    v3:     await fetchExchangeV3(),
    wallet: await fetchWalletBalances(),
    loans:  await fetchLoanData()
  };
};
