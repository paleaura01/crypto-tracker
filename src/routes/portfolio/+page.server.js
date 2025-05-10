import { error }            from '@sveltejs/kit';
import { CB_API_HOST, CB_API_PATH, CB_VERSION } from '$env/static/private';
import fetch                from 'node-fetch';
import { makeJwt }          from '$lib/server/cb-jwt';

export async function load() {
  // — Exchange (brokerage v3)
  console.log('[portfolio] fetching Exchange balances');
  const exchJwt = await makeJwt(CB_API_PATH);
  console.log('[portfolio] Exchange JWT:', exchJwt.slice(0,20) + '…');

  const exchRes = await fetch(`https://${CB_API_HOST}${CB_API_PATH}`, {
    headers: {
      Authorization: `Bearer ${exchJwt}`,
      'CB-VERSION':  CB_VERSION
    }
  });
  if (!exchRes.ok) {
    console.error('[portfolio] Exchange fetch failed', exchRes.status);
    throw error(exchRes.status, 'Could not load exchange balances');
  }
  const { accounts: exchangeAccounts } = await exchRes.json();
  console.log(`[portfolio] got ${exchangeAccounts.length} exchange accounts`);

  // — Wallet (core v2)
  const WALLET_PATH = '/api/v2/accounts';
  console.log('[portfolio] fetching Wallet balances');
  const walletJwt = await makeJwt(WALLET_PATH);
  console.log('[portfolio] Wallet JWT:', walletJwt.slice(0,20) + '…');

  const walletRes = await fetch(`https://${CB_API_HOST}${WALLET_PATH}`, {
    headers: {
      Authorization: `Bearer ${walletJwt}`
      // no CB-VERSION for v2
    }
  });
  if (!walletRes.ok) {
    console.error('[portfolio] Wallet fetch failed', walletRes.status);
    throw error(walletRes.status, 'Could not load wallet balances');
  }
  const { data: walletAccounts = [] } = await walletRes.json();
  console.log(`[portfolio] got ${walletAccounts.length} wallet accounts`);

  return {
    exchangeAccounts,
    walletAccounts
  };
}
