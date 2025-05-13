// src/routes/portfolio/lib/cbwallet.ts
import fetch from 'node-fetch';
import { makeJwt } from '$lib/server/cb-jwt';

const WALLET_PATH = '/api/v2/accounts';

export interface WalletAccount {
  id: string;
  balance: { amount: string; currency: string };
}

export async function fetchWalletBalances(): Promise<WalletAccount[]> {
  const jwt = await makeJwt(WALLET_PATH);
  const res = await fetch(`https://api.coinbase.com${WALLET_PATH}`, {
    headers: { Authorization: `Bearer ${jwt}` }
  });
  if (!res.ok) throw new Error(`wallet fetch failed: ${res.status}`);
  const { data } = (await res.json()) as { data: WalletAccount[] };
  return data;
}
