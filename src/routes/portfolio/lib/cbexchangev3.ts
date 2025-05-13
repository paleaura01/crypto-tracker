// src/routes/portfolio/lib/cbexchangev3.ts
import fetch from 'node-fetch';
import { makeJwt } from '$lib/server/cb-jwt';

const V3_PATH    = '/api/v3/brokerage/accounts';
const CB_VERSION = '2025-01-01';

export interface ExchangeV3Account {
  id: string;
  currency: string;
  available_balance: { value: string; currency: string };
  hold_balance:      { value: string; currency: string };
}

export async function fetchExchangeV3(): Promise<ExchangeV3Account[]> {
  const jwt = await makeJwt(V3_PATH);
  const res = await fetch(`https://api.coinbase.com${V3_PATH}`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      'CB-VERSION': CB_VERSION
    }
  });
  if (!res.ok) throw new Error(`v3 fetch failed: ${res.status}`);
  const { accounts } = (await res.json()) as { accounts: ExchangeV3Account[] };
  return accounts;
}
