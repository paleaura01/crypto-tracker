import { redirect } from '@sveltejs/kit';
import { PUBLIC_BASE_URL } from '$env/static/public';
import { COINBASE_AUTH_URL, COINBASE_CLIENT_ID } from '$env/static/private';

export function GET() {
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     COINBASE_CLIENT_ID,
    redirect_uri:  `${PUBLIC_BASE_URL}/api/cb/oauth2/callback`,
    scope:         'exchange:accounts:read offline_access',
    state
  });
  throw redirect(302, `${COINBASE_AUTH_URL}?${params}`);
}
