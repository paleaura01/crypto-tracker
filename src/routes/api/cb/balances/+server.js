// src/routes/api/cb/balances/+server.js
import { json }          from '@sveltejs/kit';
import { readFileSync }  from 'fs';
import { randomBytes }   from 'crypto';
import path              from 'path';
import fetch             from 'node-fetch';
import jwt               from 'jsonwebtoken';
import {
  CDP_KEY_FILE,
  CDP_KEY_NAME,
  CB_API_HOST,
  CB_API_PATH,
  CB_VERSION
} from '$env/static/private';

function makeJwt() {
  // 1) load the raw SEC1 PEM from your downloaded JSON
  const { privateKey: sec1Pem } = JSON.parse(
    readFileSync(path.resolve(process.cwd(), CDP_KEY_FILE), 'utf8')
  );

  const now   = Math.floor(Date.now() / 1000);
  const nonce = randomBytes(16).toString('hex');
  const uri   = `GET ${CB_API_HOST}${CB_API_PATH}`;

  return jwt.sign(
    {
      iss: 'cdp',
      sub: CDP_KEY_NAME,
      iat: now,
      nbf: now,
      exp: now + 120,
      uri
    },
    sec1Pem,
    {
      algorithm: 'ES256',
      header:    { kid: CDP_KEY_NAME, nonce }
    }
  );
}

export async function GET() {
  let token;
  try {
    token = makeJwt();
  } catch (err) {
    console.error('JWT sign error', err);
    return json({ error: 'jwt_sign_failed', detail: err.message }, { status: 500 });
  }

  const url = `https://${CB_API_HOST}${CB_API_PATH}`;
  console.log('[balances] fetching →', url);
  console.log('[balances] Authorization: Bearer', token.slice(0, 20) + '…');

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'CB-VERSION':  CB_VERSION
    }
  });

  const text = await res.text();
  console.log('[balances] status', res.status);
  console.log('[balances] raw response:', text);

  if (!res.ok) {
    return json({ error: 'fetch_failed', status: res.status, detail: text }, { status: res.status });
  }

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    console.error('[balances] invalid JSON');
    return json({ error: 'invalid_json' }, { status: 500 });
  }

  // inspect what the API actually returned
  console.log('[balances] parsed payload:', payload);

  const accounts = payload.accounts || [];
  const nonZero = accounts
    .filter(a => Number(a.balance?.amount || 0) > 0)
    .map(a => ({
      currency: a.balance.currency,
      amount:   a.balance.amount
    }));

  if (nonZero.length === 0) {
    // return full accounts so you can see every field
    return json({ warning: 'no non-zero balances', accounts }, { status: 200 });
  }

  return json(nonZero);
}
