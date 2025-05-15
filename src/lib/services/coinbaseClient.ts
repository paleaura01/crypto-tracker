import { readFileSync } from 'fs';
import { resolve } from 'path';
import crypto from 'crypto';
import nacl from 'tweetnacl';
import { importJWK, SignJWT, type JWK } from 'jose';
import type {
  ExchangeV2Account,
  ExchangeV3Account,
  WalletAccount,
  LoanData
} from '$lib/types/database';

const HOST    = 'api.coinbase.com';
const V2_PATH = '/api/v2/accounts';
const V3_PATH = '/api/v3/brokerage/accounts';
const VERSION = '2025-01-01';

const KEY_FILE = 'cdp_api_keyEd25519.json';
const KEY_KID  = '045fe4fa-eb85-4434-89fd-675dd7421885';

let jwkCache: JWK | null = null;
async function loadJwk(): Promise<JWK> {
  if (jwkCache) return jwkCache;
  const { privateKey } = JSON.parse(
    readFileSync(resolve(process.cwd(), KEY_FILE), 'utf8')
  ) as { privateKey: string };
  const seed = Buffer.from(privateKey, 'base64').subarray(0, 32);
  const { publicKey } = nacl.sign.keyPair.fromSeed(new Uint8Array(seed));
  jwkCache = {
    kty: 'OKP',
    crv: 'Ed25519',
    d: Buffer.from(seed).toString('base64url'),
    x: Buffer.from(publicKey).toString('base64url'),
    kid: KEY_KID
  };
  return jwkCache;
}

async function makeJwt(path: string): Promise<string> {
  const jwk = await loadJwk();
  const key = await importJWK(jwk, 'EdDSA');
  const now = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  return new SignJWT({
    iss: 'cdp',
    sub: jwk.kid,
    iat: now,
    nbf: now,
    exp: now + 120,
    uri: `GET ${HOST}${path}`
  })
    .setProtectedHeader({ alg: 'EdDSA', kid: jwk.kid, nonce })
    .sign(key);
}

async function cbGet<T>(path: string, version?: string): Promise<T> {
  const jwt = await makeJwt(path);
  const headers: Record<string,string> = { Authorization: `Bearer ${jwt}` };
  if (version) headers['CB-VERSION'] = version;
  const res = await fetch(`https://${HOST}${path}`, { headers });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GET ${path} → ${res.status}: ${txt}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchExchangeV2(): Promise<ExchangeV2Account[]> {
  const { data } = await cbGet<{ data: ExchangeV2Account[] }>(V2_PATH);
  return data;
}

export async function fetchExchangeV3(): Promise<ExchangeV3Account[]> {
  const { accounts } = await cbGet<{ accounts: ExchangeV3Account[] }>(
    V3_PATH,
    VERSION
  );
  return accounts;
}

export async function fetchWalletBalances(): Promise<WalletAccount[]> {
  const { data } = await cbGet<{ data: WalletAccount[] }>(V2_PATH);
  return data;
}

export async function fetchLoanData(): Promise<LoanData[]> {
  return [];
}
