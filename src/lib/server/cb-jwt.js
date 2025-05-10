// src/lib/server/cb-jwt.js
import { readFileSync } from 'fs';
import { resolve }      from 'path';
import { importPKCS8, SignJWT } from 'jose';
import crypto           from 'crypto';
import {
  CDP_KEY_FILE,
  CDP_KEY_NAME,
  CB_API_HOST,
  CB_API_PATH,
  CB_VERSION
} from '$env/static/private';

/**
 * Loads your downloaded JSON key, which must look like:
 *   { "name": "<your keyName>", "privateKey": "-----BEGIN EC PRIVATE KEY-----\n…\n-----END EC PRIVATE KEY-----\n" }
 */
function loadKey() {
  const path = resolve(process.cwd(), CDP_KEY_FILE);
  const raw  = readFileSync(path, 'utf8');
  const { name, privateKey } = JSON.parse(raw);
  return { name, privateKey };
}

/** Build and sign a 2-minute JWT for Coinbase App (brokerage) */
export async function makeJwt() {
  const { name: kid, privateKey: pem } = loadKey();

  // import the PEM EC key (must be PKCS#8 or SEC1 EC)
  const key = await importPKCS8(pem, 'ES256');

  const now   = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  const uri   = `GET ${CB_API_HOST}${CB_API_PATH}`;

  return new SignJWT({
    iss: 'cdp',
    sub: kid,
    iat: now,
    nbf: now,
    exp: now + 120,
    uri
  })
    .setProtectedHeader({ alg: 'ES256', kid, nonce })
    .sign(key);
}
