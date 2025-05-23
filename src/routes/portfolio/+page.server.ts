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
  if (!session?.user) throw redirect(303, '/auth/login');
  const userId = session.user.id;

  // ensure coinbase key
  let hasKey = true;
  try { await getCoinbaseKey(userId); }
  catch { hasKey = false; }

  if (!hasKey) {
    return {
      hasCoinbaseKey: false,
      exchangeV2: [] as ExchangeV2Account[],
      exchangeV3: [] as ExchangeV3Account[],
      wallet: [] as WalletAccount[],
      loans: [] as LoanData[],
      userId            // ← include here
    };
  }

  const [exchangeV2, exchangeV3] = await Promise.all([
    fetchExchangeV2(userId),
    fetchExchangeV3(userId)
  ]);

  let wallet: WalletAccount[] = [];
  try { wallet = await fetchWalletBalances(userId); } catch {}
  let loans: LoanData[] = [];
  try { loans = await fetchLoanData(userId); } catch {}

  return {
    hasCoinbaseKey: true,
    exchangeV2,
    exchangeV3,
    wallet,
    loans,
    userId           // ← and here
  };
};
