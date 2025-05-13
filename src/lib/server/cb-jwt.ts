// ▶ src/lib/server/cb-jwt.ts

import { readFileSync } from 'fs';
import { resolve }      from 'path';
import crypto           from 'crypto';
import nacl             from 'tweetnacl';
import { importJWK, SignJWT } from 'jose';
import type { JWK }           from 'jose';

const CB_API_HOST = 'api.coinbase.com';
import {
  CDP_KEY_FILE,
  CDP_KEY_FILE2,
  CDP_KEY_NAME,
  CDP_KEY_NAME2
} from '$env/static/private';

let cachedJwk: JWK | null = null;
async function getJwk(): Promise<JWK> {
  if (cachedJwk) return cachedJwk;
  const keyFile = CDP_KEY_FILE2 && CDP_KEY_NAME2 ? CDP_KEY_FILE2 : CDP_KEY_FILE;
  const keyName = CDP_KEY_FILE2 && CDP_KEY_NAME2 ? CDP_KEY_NAME2 : CDP_KEY_NAME;
  const fullPath = resolve(process.cwd(), keyFile);
  const { privateKey } = JSON.parse(readFileSync(fullPath, 'utf8')) as { privateKey: string };
  const blob = Buffer.from(privateKey, 'base64');
  const seed = blob.slice(0, 32);
  const { publicKey } = nacl.sign.keyPair.fromSeed(new Uint8Array(seed));
  cachedJwk = {
    kty: 'OKP',
    crv: 'Ed25519',
    d:   Buffer.from(seed).toString('base64url'),
    x:   Buffer.from(publicKey).toString('base64url'),
    kid: keyName
  };
  return cachedJwk;
}

export async function makeJwt(apiPath: string): Promise<string> {
  const jwk = await getJwk();
  const key = await importJWK(jwk, 'EdDSA');
  const now   = Math.floor(Date.now()/1000);
  const nonce = crypto.randomBytes(16).toString('hex');
  const uri   = `GET ${CB_API_HOST}${apiPath}`;
  return new SignJWT({ iss:'cdp', sub:jwk.kid, iat:now, nbf:now, exp:now+120, uri })
    .setProtectedHeader({ alg:'EdDSA', kid:jwk.kid, nonce })
    .sign(key);
}
