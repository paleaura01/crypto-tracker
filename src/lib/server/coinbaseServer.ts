// src/lib/server/coinbaseServer.ts
import { supabaseServer } from './supabaseServer';
import crypto from 'crypto';

import nacl from 'tweetnacl';
import { importJWK, SignJWT, type JWK } from 'jose';
import { env } from '$env/dynamic/private';
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
const CUSTODIAL_PATH = '/api/v2/accounts';


// Load raw key from your profiles table
async function loadRawKey(userId: string): Promise<any> {
  const { data, error } = await supabaseServer
    .from('profiles')
    .select('coinbase_key_json')
    .eq('id', userId)
    .single();

  if (error || !data?.coinbase_key_json) {
    throw new Error(`Coinbase key not found for user ${userId}`);
  }
  return typeof data.coinbase_key_json === 'string'
    ? JSON.parse(data.coinbase_key_json)
    : data.coinbase_key_json;
}

const jwkCache = new Map<string, JWK>();

async function getJwk(userId: string): Promise<JWK> {
  if (jwkCache.has(userId)) return jwkCache.get(userId)!;
  const parsed = await loadRawKey(userId);
  let jwk: JWK;

  if (parsed.kty && parsed.d && parsed.x) {
    jwk = { ...(parsed as JWK), kid: parsed.id ?? parsed.name };
  } else if (parsed.privateKey && parsed.privateKey.includes('BEGIN')) {
    const keyObj = crypto.createPrivateKey({ key: parsed.privateKey, format: 'pem' });
    jwk = keyObj.export({ format: 'jwk' }) as JWK;
    jwk.kid = parsed.id ?? parsed.name;
  } else {
    // assume Ed25519 seed
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
  }

  jwkCache.set(userId, jwk);
  return jwk;
}

function getAlg(jwk: JWK): 'EdDSA' | 'ES256' | 'ES384' | 'ES512' {
  if (jwk.kty === 'OKP' && jwk.crv === 'Ed25519') return 'EdDSA';
  if (jwk.kty === 'EC') {
    if (jwk.crv === 'P-256') return 'ES256';
    if (jwk.crv === 'P-384') return 'ES384';
    if (jwk.crv === 'P-521') return 'ES512';
  }
  throw new Error(`Unsupported JWK: ${jwk.kty}/${jwk.crv}`);
}

async function makeJwt(userId: string, path: string): Promise<string> {
  const jwk = await getJwk(userId);
  const alg = getAlg(jwk);
  const key = await importJWK(jwk, alg);
  const now = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  const uri = `GET ${CB_API_HOST}${path}`;

  return new SignJWT({ iss: 'cdp', sub: jwk.kid, iat: now, nbf: now, exp: now + 120, uri })
    .setProtectedHeader({ alg, kid: jwk.kid, nonce })
    .sign(key);
}

async function cbGet<T>(userId: string, path: string, version?: string): Promise<T> {
  const jwt = await makeJwt(userId, path);
  const headers: Record<string,string> = { Authorization: `Bearer ${jwt}` };
  if (version) headers['CB-VERSION'] = version;

  const res = await fetch(`https://${CB_API_HOST}${path}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Coinbase ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchExchangeV2(userId: string): Promise<ExchangeV2Account[]> {
  const { data } = await cbGet<{ data: ExchangeV2Account[] }>(userId, V2_PATH);
  return data;
}

export async function fetchExchangeV3(userId: string): Promise<ExchangeV3Account[]> {
  const { accounts } = await cbGet<{ accounts: ExchangeV3Account[] }>(userId, V3_PATH, CB_VERSION);
  return accounts;
}

export async function fetchWalletBalances(userId: string): Promise<WalletAccount[]> {
  const { data } = await cbGet<{ data: WalletAccount[] }>(userId, V2_PATH);
  return data.filter(a => a.type === 'wallet');
}

export async function fetchLoanData(userId: string): Promise<LoanData[]> {
  const { data, error } = await supabaseServer
    .from('loan_calculations')
    // select the UUID plus the numeric columns
    .select('id, collateral_btc, borrowed_usdc')
    .eq('user_id', userId)
    .limit(1);

  if (error) throw error;

  // Map each row to { id, collateral, loanAmount }
  return (data || []).map(row => ({
    id:         row.id,
    collateral: row.collateral_btc,
    loanAmount: row.borrowed_usdc
  }));
}
export async function getCoinbaseKey(userId: string): Promise<any> {
  return loadRawKey(userId);
}

/** A custodial Coinbase.com wallet account */
export interface CustodialAccount {
  id: string;
  name: string;
  balance: { amount: string; currency: string };
}

export async function fetchCustodialBalances(
  userId: string
): Promise<CustodialAccount[]> {
  // this will return all your Coinbase.com wallets (custodial)
  const { data } = await cbGet<{ data: CustodialAccount[] }>(
    userId,
    CUSTODIAL_PATH
  );
  return data;
}