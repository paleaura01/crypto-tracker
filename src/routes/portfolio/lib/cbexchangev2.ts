// src/routes/portfolio/lib/cbexchangev2.ts
import fetch from 'node-fetch';
import { makeJwt } from '$lib/server/cb-jwt';

const V2_PATH = '/api/v2/accounts';

export interface ExchangeV2Account {
  id: string;
  currency: { code: string; name: string };
  balance:  { amount: string; currency: string };
}

export async function fetchExchangeV2(): Promise<ExchangeV2Account[]> {
  const jwt = await makeJwt(V2_PATH);
  const res = await fetch(`https://api.coinbase.com${V2_PATH}`, {
    headers: { Authorization: `Bearer ${jwt}` }
  });
  if (!res.ok) throw new Error(`v2 fetch failed: ${res.status}`);
  const { data } = (await res.json()) as { data: ExchangeV2Account[] };
  return data;
}
