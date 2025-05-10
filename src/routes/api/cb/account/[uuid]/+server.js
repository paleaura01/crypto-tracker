// src/routes/api/cb/account/[uuid]/+server.js
import { json, error }  from '@sveltejs/kit';
import fetch             from 'node-fetch';
import { makeJwt }       from '$lib/server/cb-jwt';
import { CB_API_HOST, CB_API_PATH, CB_VERSION } from '$env/static/private';

export async function GET({ params }) {
  const { uuid } = params;
  console.log('[account] fetching detail for', uuid);
  let token;
  try {
    token = await makeJwt();
  } catch (err) {
    console.error('[account] jwt error', err);
    throw error(500, 'JWT failed');
  }

  const res = await fetch(`https://${CB_API_HOST}${CB_API_PATH}/${uuid}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'CB-VERSION':  CB_VERSION
    }
  });
  console.log('[account] status', res.status);
  const text = await res.text();
  console.log('[account] raw response', text);
  if (!res.ok) {
    throw error(res.status, text);
  }
  return json(JSON.parse(text).account);
}
