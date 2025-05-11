// cb-wallet.js  ─────────────────────────────────────────────
// get on‑chain wallet balances (core v2)
import fetch from 'node-fetch';
import { makeJwt } from './cb-jwt.js';
import { CB_API_HOST } from '$env/static/private';

const WALLET_PATH = '/api/v2/accounts';

export async function fetchWalletBalances () {
  const jwt = await makeJwt(WALLET_PATH);
  const res = await fetch(`https://${CB_API_HOST}${WALLET_PATH}`, {
    headers: { Authorization:`Bearer ${jwt}` }
  });
  if (!res.ok) throw new Error(`wallet ${res.status}`);
  return (await res.json()).data ?? [];
}
