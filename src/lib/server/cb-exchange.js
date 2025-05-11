// cb-exchange.js  ───────────────────────────────────────────
// get brokerage v3 balances
import fetch from 'node-fetch';
import { makeJwt } from './cb-jwt.js';
import { CB_API_HOST, CB_BROKERAGE_PATH, CB_VERSION } from '$env/static/private';

export async function fetchExchangeBalances () {
  const jwt = await makeJwt(CB_BROKERAGE_PATH);
  const res = await fetch(`https://${CB_API_HOST}${CB_BROKERAGE_PATH}`, {
    headers: { Authorization:`Bearer ${jwt}`, 'CB-VERSION':CB_VERSION }
  });
  if (!res.ok) throw new Error(`brokerage ${res.status}`);
  return (await res.json()).accounts;
}
