// src/lib/server/cb-jwt.js
import crypto           from 'crypto';
import jwt              from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { resolve }      from 'path';
import nacl             from 'tweetnacl';
import { SignJWT, importJWK } from 'jose';
import {
  CDP_KEY_FILE,
  CDP_KEY_FILE2,
  CDP_KEY_NAME,
  CDP_KEY_NAME2,
  CB_API_HOST
} from '$env/static/private';

function loadKey() {
  // pick ECDSA vs Ed25519 based on CDP_KEY_NAME2 presence
  const isEd = Boolean(CDP_KEY_FILE2 && CDP_KEY_NAME2);
  const file = isEd ? CDP_KEY_FILE2 : CDP_KEY_FILE;
  const kid  = isEd ? CDP_KEY_NAME2 : CDP_KEY_NAME;
  const raw  = JSON.parse(readFileSync(resolve(process.cwd(), file), 'utf8'));
  return { isEd, kid, payload: raw };
}

export async function makeJwt(path = '/api/v3/brokerage/accounts') {
  const { isEd, kid, payload } = loadKey();
  const now   = Math.floor(Date.now()/1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  const uri   = `GET ${CB_API_HOST}${path}`;

  if (!isEd) {
    // ECDSA via jsonwebtoken
    return jwt.sign(
      { iss:'cdp', sub:kid, iat:now, nbf:now, exp:now+120, uri },
      payload.privateKey,               // PEM SEC1
      { algorithm:'ES256', header:{ kid, nonce } }
    );
  }

  // Ed25519 via jose + tweetnacl
  // payload.privateKey is base64(seed+pub), so we trim to 32-byte seed
  const blob = Buffer.from(payload.privateKey, 'base64');
  const seed = blob.slice(0,32);
  const { publicKey } = nacl.sign.keyPair.fromSeed(seed);
  const jwk = {
    kty: 'OKP', crv:'Ed25519',
    d:  Buffer.from(seed).toString('base64url'),
    x:  Buffer.from(publicKey).toString('base64url'),
    kid
  };
  const key = await importJWK(jwk, 'EdDSA');
  return new SignJWT({ iss:'cdp', sub:kid, iat:now, nbf:now, exp:now+120, uri })
    .setProtectedHeader({ alg:'EdDSA', kid, nonce })
    .sign(key);
}
