import fetch from 'node-fetch';
import { makeJwt } from '$lib/server/cb-jwt';
import { CB_API_HOST } from '$env/static/private';

const WALLET_PATH = '/api/v2/accounts';  // core v2

/** Fetches your Coinbase Wallet (core v2) balances. */
export async function fetchWalletBalances() {
  const token = await makeJwt(WALLET_PATH);
  const res = await fetch(`https://${CB_API_HOST}${WALLET_PATH}`, {
    headers: {
      Authorization: `Bearer ${token}`
      // no CB-VERSION header for v2
    }
  });
  if (!res.ok) {
    throw new Error(`Wallet fetch failed ${res.status}`);
  }
  const { data } = await res.json();
  return data;
}
