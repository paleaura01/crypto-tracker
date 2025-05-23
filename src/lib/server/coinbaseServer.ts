// src/lib/server/coinbaseServer.ts
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import nacl from 'tweetnacl';
import { importJWK, SignJWT, type JWK } from 'jose';
import type {
  ExchangeV2Account,
  ExchangeV3Account,
  WalletAccount,
  LoanData
} from './types';
import { env } from '$env/dynamic/private';

const CB_API_HOST = 'api.coinbase.com';
const V2_PATH     = '/api/v2/accounts';
const V3_PATH     = '/api/v3/brokerage/accounts';
const LOANS_PATH  = '/api/v2/margin/loans';
const CB_VERSION  = '2025-01-01';

// Supabase admin
const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function loadRawKey(userId: string): Promise<Record<string, any>> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('coinbase_key_json')
    .eq('id', userId)
    .single();

  if (error || !data?.coinbase_key_json) {
    throw new Error(`Coinbase key not found for user ${userId}`);
  }
  const raw = data.coinbase_key_json;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

let jwkCache = new Map<string, JWK>();

async function getJwk(userId: string): Promise<JWK> {
  if (jwkCache.has(userId)) return jwkCache.get(userId)!;
  const parsed = await loadRawKey(userId);
  let jwk: JWK;

  // full JWK?
  if (parsed.kty && parsed.d && parsed.x && (parsed.id || parsed.name)) {
    jwk = { ...(parsed as JWK), kid: parsed.id ?? parsed.name };

  // PEM EC key?
  } else if (
    typeof parsed.privateKey === 'string' &&
    parsed.privateKey.includes('BEGIN') &&
    (parsed.id || parsed.name)
  ) {
    const keyObj = crypto.createPrivateKey({ key: parsed.privateKey, format: 'pem' });
    jwk = keyObj.export({ format: 'jwk' }) as JWK;
    jwk.kid = parsed.id ?? parsed.name;

  // Ed25519 seed
  } else if (
    typeof parsed.privateKey === 'string' &&
    !parsed.privateKey.includes('BEGIN') &&
    (parsed.id || parsed.name)
  ) {
    const blob = Buffer.from(parsed.privateKey, 'base64');
    const seed = blob.subarray(0, 32);
    const { publicKey } = nacl.sign.keyPair.fromSeed(new Uint8Array(seed));
    jwk = {
      kty: 'OKP',
      crv: 'Ed25519',
      d: Buffer.from(seed).toString('base64url'),
      x: Buffer.from(publicKey).toString('base64url'),
      kid: parsed.id ?? parsed.name
    };
  } else {
    throw new Error(`Unsupported key format for user ${userId}`);
  }

  jwkCache.set(userId, jwk);
  return jwk;
}

function getAlgForJwk(jwk: JWK): 'EdDSA' | 'ES256' | 'ES384' | 'ES512' {
  if (jwk.kty === 'OKP' && jwk.crv === 'Ed25519') return 'EdDSA';
  if (jwk.kty === 'EC' && jwk.crv) {
    switch (jwk.crv) {
      case 'P-256': return 'ES256';
      case 'P-384': return 'ES384';
      case 'P-521': return 'ES512';
    }
  }
  throw new Error(`Unsupported JWK kty=${jwk.kty}, crv=${jwk.crv}`);
}

async function makeJwt(userId: string, apiPath: string): Promise<string> {
  const jwk = await getJwk(userId);
  const alg = getAlgForJwk(jwk);
  const key = await importJWK(jwk, alg);
  const now = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  const uri = `GET ${CB_API_HOST}${apiPath}`;

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

async function cbGet<T>(
  userId: string,
  apiPath: string,
  version?: string
): Promise<T> {
  const jwt = await makeJwt(userId, apiPath);
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

export async function fetchExchangeV2(
  userId: string
): Promise<ExchangeV2Account[]> {
  const { data } = await cbGet<{ data: ExchangeV2Account[] }>(
    userId,
    V2_PATH
  );
  return data;
}

export async function fetchExchangeV3(
  userId: string
): Promise<ExchangeV3Account[]> {
  const { accounts } = await cbGet<{ accounts: ExchangeV3Account[] }>(
    userId,
    V3_PATH,
    CB_VERSION
  );
  return accounts;
}

export async function fetchWalletBalances(
  userId: string
): Promise<WalletAccount[]> {
  const { data } = await cbGet<{ data: WalletAccount[] }>(
    userId,
    V2_PATH
  );
  return data.filter((acct) => acct.type === 'wallet');
}

export async function fetchLoanData(
  userId: string
): Promise<LoanData[]> {
  const { data } = await cbGet<{ data: LoanData[] }>(
    userId,
    LOANS_PATH
  );
  return data;
}

export async function getCoinbaseKey(userId: string): Promise<any> {
  // simply reuse loadRawKey under the hood
  return loadRawKey(userId);
}

