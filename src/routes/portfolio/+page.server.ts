import { fetchExchangeBalances } from './lib/exchange.js';
import { fetchWalletBalances   } from './lib/wallet.js';
import { fetchLoanData         } from './lib/loans.js';
import { error } from '@sveltejs/kit';

export async function load() {
  // parallel‐invoke each
  const [exch, wallet, loan] = await Promise.allSettled([
    fetchExchangeBalances(),
    fetchWalletBalances(),
    fetchLoanData()
  ]);

  if (exch.status === 'rejected') {
    throw error(500, `Exchange error: ${exch.reason.message}`);
  }

  // if wallet fails just show empty list
  const walletAccounts = wallet.status === 'fulfilled'
    ? wallet.value
    : [];

  const loanData = loan.status === 'fulfilled'
    ? loan.value
    : null;

  return {
    exchangeAccounts: exch.value,
    walletAccounts,
    loan: loanData
  };
}