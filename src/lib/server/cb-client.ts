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
const V2_PATH     = '/api/v2/accounts';
const V3_PATH     = '/api/v3/brokerage/accounts';
const CB_VERSION  = '2025-01-01';

const CDP_KEY_FILE = 'cdp_api_keyEd25519.json';

let cachedJwk: JWK | null = null;
async function getJwk(): Promise<JWK> {
  if (cachedJwk) return cachedJwk;

  const raw    = readFileSync(resolve(process.cwd(), CDP_KEY_FILE), 'utf8');
  const parsed = JSON.parse(raw) as Record<string, any>;

  // 1) Full JWK JSON?
  if (parsed.kty && parsed.d && parsed.x && (parsed.id || parsed.name)) {
    cachedJwk = {
      ...(parsed as JWK),
      kid: parsed.id ?? parsed.name
    };
    return cachedJwk;
  }

  // 2) PEM-encoded EC key?
  if (typeof parsed.privateKey === 'string' && parsed.privateKey.includes('BEGIN') && (parsed.id || parsed.name)) {
    const keyObj = crypto.createPrivateKey({ key: parsed.privateKey, format: 'pem' });
    const jwk    = keyObj.export({ format: 'jwk' }) as JWK;
    jwk.kid      = parsed.id ?? parsed.name;
    cachedJwk    = jwk;
    return cachedJwk;
  }

  // 3) Ed25519 seed JSON?
  if (typeof parsed.privateKey === 'string' && !parsed.privateKey.includes('BEGIN') && (parsed.id || parsed.name)) {
    const blob = Buffer.from(parsed.privateKey, 'base64');
    const seed = blob.subarray(0, 32);
    const { publicKey } = nacl.sign.keyPair.fromSeed(new Uint8Array(seed));

    cachedJwk = {
      kty: 'OKP',
      crv: 'Ed25519',
      d:   Buffer.from(seed).toString('base64url'),
      x:   Buffer.from(publicKey).toString('base64url'),
      kid: parsed.id ?? parsed.name
    };
    return cachedJwk;
  }

  throw new Error(`Unsupported key format in ${CDP_KEY_FILE}`);
}

function getAlgForJwk(jwk: JWK): 'EdDSA' | 'ES256' | 'ES384' | 'ES512' {
  if (jwk.kty === 'OKP' && jwk.crv === 'Ed25519') {
    return 'EdDSA';
  }
  if (jwk.kty === 'EC' && jwk.crv) {
    switch (jwk.crv) {
      case 'P-256': return 'ES256';
      case 'P-384': return 'ES384';
      case 'P-521': return 'ES512';
    }
  }
  throw new Error(`Unsupported JWK kty=${jwk.kty}, crv=${jwk.crv}`);
}

export async function makeJwt(apiPath: string): Promise<string> {
  const jwk = await getJwk();
  const alg = getAlgForJwk(jwk);
  const key = await importJWK(jwk, alg);

  const now   = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  const uri   = `GET ${CB_API_HOST}${apiPath}`;

  return new SignJWT({
      iss: 'cdp',
      sub: jwk.kid,
      iat: now,
      nbf: now,
      exp: now + 120,
      uri
    })
    .setProtectedHeader({ alg, kid: jwk.kid, nonce })
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
    const text = await res.text();
    throw new Error(`GET ${apiPath} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchExchangeV2(): Promise<ExchangeV2Account[]> {
  const { data } = await cbGet<{ data: ExchangeV2Account[] }>(V2_PATH);
  return data;
}

export async function fetchExchangeV3(): Promise<ExchangeV3Account[]> {
  const { accounts } = await cbGet<{ accounts: ExchangeV3Account[] }>(V3_PATH, CB_VERSION);
  return accounts;
}

export async function fetchWalletBalances(): Promise<WalletAccount[]> {
  const { data } = await cbGet<{ data: WalletAccount[] }>(V2_PATH);
  return data;
}

export async function fetchLoanData(): Promise<LoanData | null> {
  return null;
}
