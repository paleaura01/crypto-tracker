#!/usr/bin/env node

/**
 * test-coinbase-loans.js
 *
 * Usage:
 *   node test-coinbase-loans.js <path to cdp_api_key.json>
 *
 * This script will:
 *  - load your Coinbase key JSON (full JWK, PEM EC, or Ed25519 seed)
 *  - sign a JWT for GET /api/v2/margin/loans
 *  - fetch your margin loan positions
 *  - log currency, amount, and loan-to-value for each loan
 */

import fs from 'fs';
import crypto from 'crypto';
import nacl from 'tweetnacl';
import fetch from 'node-fetch';
import { importJWK, SignJWT } from 'jose';

const CB_API_HOST = 'api.coinbase.com';
const LOANS_PATH  = '/api/v2/margin/loans';

async function loadKey(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);

  // 1) Full JWK JSON?
  if (parsed.kty && parsed.d && parsed.x && (parsed.id || parsed.name)) {
    return { ...parsed, kid: parsed.id ?? parsed.name };
  }

  // 2) PEM-encoded EC key?
  if (typeof parsed.privateKey === 'string' &&
      parsed.privateKey.includes('BEGIN') &&
      (parsed.id || parsed.name)) {
    const keyObj = crypto.createPrivateKey({ key: parsed.privateKey, format: 'pem' });
    const jwk = keyObj.export({ format: 'jwk' });
    jwk.kid = parsed.id ?? parsed.name;
    return jwk;
  }

  // 3) Ed25519 seed JSON?
  if (typeof parsed.privateKey === 'string' &&
      !parsed.privateKey.includes('BEGIN') &&
      (parsed.id || parsed.name)) {
    const blob = Buffer.from(parsed.privateKey, 'base64');
    const seed = blob.subarray(0, 32);
    const { publicKey } = nacl.sign.keyPair.fromSeed(seed);
    return {
      kty: 'OKP',
      crv: 'Ed25519',
      d: Buffer.from(seed).toString('base64url'),
      x: Buffer.from(publicKey).toString('base64url'),
      kid: parsed.id ?? parsed.name
    };
  }

  throw new Error('Unsupported key format in ' + filePath);
}

function getAlgForJwk(jwk) {
  if (jwk.kty === 'OKP' && jwk.crv === 'Ed25519') return 'EdDSA';
  if (jwk.kty === 'EC' && jwk.crv === 'P-256') return 'ES256';
  if (jwk.kty === 'EC' && jwk.crv === 'P-384') return 'ES384';
  if (jwk.kty === 'EC' && jwk.crv === 'P-521') return 'ES512';
  throw new Error(`Unsupported JWK kty=${jwk.kty}, crv=${jwk.crv}`);
}

async function makeJwt(jwk, apiPath) {
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

async function fetchMarginLoans(jwk) {
  const jwt = await makeJwt(jwk, LOANS_PATH);
  const res = await fetch(`https://${CB_API_HOST}${LOANS_PATH}`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      'CB-VERSION': '2025-01-01'
    }
  });
  if (!res.ok) {
    throw new Error(`GET ${LOANS_PATH} → ${res.status}: ${await res.text()}`);
  }
  const { data } = await res.json();
  return data.map(loan => ({
    currency:       loan.currency,
    amount:         loan.amount,
    loanToValue:    loan.loan_to_value
  }));
}

(async () => {
  const keyPath = process.argv[2];
  if (!keyPath) {
    console.error('Usage: node test-coinbase-loans.js <path to cdp_api_key.json>');
    process.exit(1);
  }

  try {
    console.log('🔑 Loading key from', keyPath);
    const jwk = await loadKey(keyPath);

    console.log('🚀 Fetching margin loans…');
    const loans = await fetchMarginLoans(jwk);

    if (loans.length === 0) {
      console.log('✅ No open margin loans returned.');
    } else {
      console.log('✅ Open margin loans:');
      for (const ln of loans) {
        console.log(`  • ${ln.currency}: ${ln.amount} (LTV: ${ln.loanToValue})`);
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
