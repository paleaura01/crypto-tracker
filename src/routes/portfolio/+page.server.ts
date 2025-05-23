import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

import {
  getCoinbaseKey,
  fetchExchangeV2,
  fetchExchangeV3,
  fetchWalletBalances,
  fetchLoanData
} from '$lib/server/coinbaseServer';

import type {
  ExchangeV2Account,
  ExchangeV3Account,
  WalletAccount,
  LoanData
} from '$lib/server/types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;
  if (!session?.user) {
    throw redirect(303, '/auth/login');
  }
  const userId = session.user.id;

  // Check if the user has uploaded a key yet
  let hasCoinbaseKey = true;
  try {
    await getCoinbaseKey(userId);
  } catch {
    hasCoinbaseKey = false;
  }

  // If no key, return early without error
  if (!hasCoinbaseKey) {
    return {
      hasCoinbaseKey: false,
      exchangeV2: [] as ExchangeV2Account[],
      exchangeV3: [] as ExchangeV3Account[],
      wallet: [] as WalletAccount[],
      loans: [] as LoanData[]
    };
  }

  // Otherwise load V2/V3 (bubble errors) and swallow wallet/loans errors
  const [v2, v3] = await Promise.all([
    fetchExchangeV2(userId),
    fetchExchangeV3(userId)
  ]);

  let wallet: WalletAccount[] = [];
  try {
    wallet = await fetchWalletBalances(userId);
  } catch { /* ignore */ }

  let loans: LoanData[] = [];
  try {
    loans = await fetchLoanData(userId);
  } catch { /* ignore */ }

  return {
    hasCoinbaseKey: true,
    exchangeV2: v2,
    exchangeV3: v3,
    wallet,
    loans
  };
};
