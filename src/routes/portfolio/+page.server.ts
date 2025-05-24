import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import {
  getCoinbaseKey,
  fetchExchangeV2,
  fetchExchangeV3,
  fetchWalletBalances,
  fetchLoanData,
  fetchCustodialBalances
} from '$lib/server/coinbaseServer';
import type {
  ExchangeV2Account,
  ExchangeV3Account,
  WalletAccount,
  LoanData,
  CustodialAccount
} from '$lib/server/types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;
  if (!session?.user) throw redirect(303, '/auth/login');
  const userId = session.user.id;

  let hasCoinbaseKey = true;
  try {
    await getCoinbaseKey(userId);
  } catch {
    hasCoinbaseKey = false;
  }

  if (!hasCoinbaseKey) {
    return {
      hasCoinbaseKey: false,
      exchangeV2:     [] as ExchangeV2Account[],
      exchangeV3:     [] as ExchangeV3Account[],
      wallet:         [] as WalletAccount[],
      loans:          [] as LoanData[],
      custodial:      [] as CustodialAccount[]
    };
  }

  const [exchangeV2, exchangeV3, wallet, loans, custodial] = await Promise.all([
    fetchExchangeV2(userId),
    fetchExchangeV3(userId),
    fetchWalletBalances(userId),
    fetchLoanData(userId),
    fetchCustodialBalances(userId)
  ]);

  return {
    hasCoinbaseKey,
    exchangeV2,
    exchangeV3,
    wallet,
    loans,
    custodial
  };
};
