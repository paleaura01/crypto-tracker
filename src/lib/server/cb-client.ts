// src/lib/server/cb-client.ts
import { readFileSync } from 'fs';
import { resolve } from 'path';
import crypto from 'crypto';
import nacl from 'tweetnacl';
import fetch from 'node-fetch';
import { importJWK, SignJWT, type JWK } from 'jose';
import type {
  ExchangeV2Account,
  ExchangeV3Account,
  WalletAccount,
  LoanData
} from './types';

const CB_API_HOST = 'api.coinbase.com';
const V2_PATH = '/api/v2/accounts';
const V3_PATH = '/api/v3/brokerage/accounts';
const CB_VERSION = '2025-01-01';

// hard-coded because you said “no env file for this”
const CDP_KEY_FILE = 'cdp_api_keyEd25519.json';
const CDP_KEY_NAME = '045fe4fa-eb85-4434-89fd-675dd7421885';

let cachedJwk: JWK | null = null;
async function getJwk(): Promise<JWK> {
  if (cachedJwk) return cachedJwk;
  const raw = readFileSync(resolve(process.cwd(), CDP_KEY_FILE), 'utf8');
  const { privateKey } = JSON.parse(raw) as { privateKey: string };
  const blob = Buffer.from(privateKey, 'base64');
  const seed = blob.slice(0, 32);
  const { publicKey } = nacl.sign.keyPair.fromSeed(new Uint8Array(seed));
  cachedJwk = {
    kty: 'OKP',
    crv: 'Ed25519',
    d: Buffer.from(seed).toString('base64url'),
    x: Buffer.from(publicKey).toString('base64url'),
    kid: CDP_KEY_NAME
  };
  return cachedJwk;
}

export async function makeJwt(apiPath: string): Promise<string> {
  const jwk = await getJwk();
  const key = await importJWK(jwk, 'EdDSA');
  const now = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  const uri = `GET ${CB_API_HOST}${apiPath}`;
  return new SignJWT({
      iss: 'cdp', sub: jwk.kid, iat: now, nbf: now, exp: now + 120, uri
    })
    .setProtectedHeader({ alg: 'EdDSA', kid: jwk.kid, nonce })
    .sign(key);
}

async function cbGet<T>(apiPath: string, version?: string): Promise<T> {
  const jwt = await makeJwt(apiPath);
  const headers: Record<string,string> = {
    Authorization: `Bearer ${jwt}`,
    ...(version ? { 'CB-VERSION': version } : {})
  };
  const res = await fetch(`https://${CB_API_HOST}${apiPath}`, { headers });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GET ${apiPath} → ${res.status}: ${txt}`);
  }
  return res.json() as Promise<T>;
}

// v2 Exchange
export async function fetchExchangeV2(): Promise<ExchangeV2Account[]> {
  const { data } = await cbGet<{ data: ExchangeV2Account[] }>(V2_PATH);
  return data;
}

// v3 Brokerage
export async function fetchExchangeV3(): Promise<ExchangeV3Account[]> {
  const { accounts } = await cbGet<{ accounts: ExchangeV3Account[] }>(V3_PATH, CB_VERSION);
  return accounts;
}

// on-chain wallet
export async function fetchWalletBalances(): Promise<WalletAccount[]> {
  const { data } = await cbGet<{ data: WalletAccount[] }>(V2_PATH);
  return data;
}

// stubbed loans
export async function fetchLoanData(): Promise<LoanData> {
  return null;
}
