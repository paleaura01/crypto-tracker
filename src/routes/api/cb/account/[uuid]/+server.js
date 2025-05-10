// src/routes/api/cb/account/[uuid]/+server.js
import { json }                from '@sveltejs/kit';
import fetch                    from 'node-fetch';
import { makeJwt }              from '$lib/server/cb-jwt';
import {
  CB_API_HOST,
  CB_API_PATH,
  CB_VERSION
} from '$env/static/private';

/** GET /api/cb/account/:uuid */
export async function GET({ params }) {
  const { uuid } = params;

  let jwt;
  try {
    jwt = await makeJwt();
  } catch (err) {
    console.error('JWT sign failed', err);
    return json({ error: 'jwt_sign_failed' }, { status: 500 });
  }

  const url = `https://${CB_API_HOST}${CB_API_PATH}/${uuid}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      'CB-VERSION':  CB_VERSION
    }
  });

  const text = await res.text();
  if (!res.ok) {
    console.error('account fetch failed', res.status, text);
    return json({ error: 'fetch_failed', detail: text }, { status: res.status });
  }

  const { account } = JSON.parse(text);
  return json(account);
}
