// src/routes/api/cb/oauth2/auth/+server.js
import { redirect } from '@sveltejs/kit';
import {
  COINBASE_CLIENT_ID,
  COINBASE_REDIRECT_URI
} from '$env/static/private';

export function GET() {
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     COINBASE_CLIENT_ID,
    redirect_uri:  COINBASE_REDIRECT_URI,
    scope:         'wallet:accounts:read wallet:user:read',
    state,
    account:       'all'
  });

  throw redirect(302, `https://login.coinbase.com/oauth2/auth?${params}`);
}
