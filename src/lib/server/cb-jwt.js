import { readFileSync } from 'fs';
import { resolve }      from 'path';
import crypto           from 'crypto';
import nacl             from 'tweetnacl';
import { importJWK, SignJWT } from 'jose';

import {
  CDP_KEY_FILE,
  CDP_KEY_FILE2,
  CDP_KEY_NAME,
  CDP_KEY_NAME2,
  CB_API_HOST
} from '$env/static/private';

/**
 * @param {string} apiPath  the request path (e.g. '/api/v3/brokerage/accounts' or '/api/v2/accounts')
 */
export async function makeJwt(apiPath) {
  console.log('[cb-jwt] ENV →', { CDP_KEY_FILE, CDP_KEY_FILE2, CDP_KEY_NAME, CDP_KEY_NAME2, CB_API_HOST, apiPath });

  // pick Ed25519 if available, otherwise ECDSA (not shown here)
  const keyFile = CDP_KEY_FILE2 && CDP_KEY_NAME2 ? CDP_KEY_FILE2 : CDP_KEY_FILE;
  const keyName = CDP_KEY_FILE2 && CDP_KEY_NAME2 ? CDP_KEY_NAME2 : CDP_KEY_NAME;
  console.log('[cb-jwt] picking key →', keyFile, keyName);

  // load the JSON key
  const fullPath = resolve(process.cwd(), keyFile);
  console.log('[cb-jwt] reading keyfile at', fullPath);
  const { privateKey } = JSON.parse(readFileSync(fullPath, 'utf8'));

  // Ed25519: privateKey is a base64 blob of seed+pubkey
  const blob = Buffer.from(privateKey, 'base64');
  console.log('[cb-jwt] full blob length:', blob.length);
  const seed = blob.slice(0, 32);
  console.log('[cb-jwt] trimming blob → seed length', seed.length);

  // derive public key
  const { publicKey } = nacl.sign.keyPair.fromSeed(new Uint8Array(seed));

  // build JWK
  const jwk = {
    kty: 'OKP',
    crv: 'Ed25519',
    d:   Buffer.from(seed).toString('base64url'),
    x:   Buffer.from(publicKey).toString('base64url'),
    kid: keyName
  };
  console.log('[cb-jwt] built JWK:', { kid: jwk.kid, crv: jwk.crv });

  // import JWK & create JWT
  const key = await importJWK(jwk, 'EdDSA');
  const now   = Math.floor(Date.now()/1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  const uri   = `GET ${CB_API_HOST}${apiPath}`;

  return new SignJWT({ iss: 'cdp', sub: keyName, iat: now, nbf: now, exp: now + 120, uri })
    .setProtectedHeader({ alg: 'EdDSA', kid: keyName, nonce })
    .sign(key);
}
