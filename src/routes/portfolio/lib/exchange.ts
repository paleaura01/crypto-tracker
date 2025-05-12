import fetch from 'node-fetch';
import { makeJwt } from '$lib/server/cb-jwt';
import { CB_API_HOST, CB_API_PATH, CB_VERSION } from '$env/static/private';

/** Fetches your Coinbase Exchange (brokerage v3) balances. */
export async function fetchExchangeBalances() {
  const token = await makeJwt(CB_API_PATH);
  const res = await fetch(`https://${CB_API_HOST}${CB_API_PATH}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'CB-VERSION':   CB_VERSION
    }
  });
  if (!res.ok) {
    throw new Error(`Exchange fetch failed ${res.status}`);
  }
  const { accounts } = await res.json();
  return accounts;
}
