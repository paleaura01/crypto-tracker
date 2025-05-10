import { json } from '@sveltejs/kit';
import { Buffer } from 'buffer';
import { PUBLIC_BASE_URL } from '$env/static/public';
import {
  COINBASE_TOKEN_URL,
  COINBASE_CLIENT_ID,
  COINBASE_CLIENT_SECRET
} from '$env/static/private';

export async function GET({ url, cookies }) {
  const code = url.searchParams.get('code');
  if (!code) return json({ error: 'missing code' }, { status: 400 });

  const form = new URLSearchParams({
    grant_type:   'authorization_code',
    code,
    redirect_uri: `${PUBLIC_BASE_URL}/api/cb/oauth2/callback`
  });

  const tokenRes = await fetch(COINBASE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' +
        Buffer.from(`${COINBASE_CLIENT_ID}:${COINBASE_CLIENT_SECRET}`)
              .toString('base64')
    },
    body: form.toString()
  });

  const tokens = await tokenRes.json();
  if (!tokenRes.ok) {
    console.error('Token exchange failed:', tokens);
    return json({ error: tokens }, { status: tokenRes.status });
  }

  // stash in HTTP-only cookies
  cookies.set('cb_access_token',  tokens.access_token,  { path: '/', httpOnly: true });
  cookies.set('cb_refresh_token', tokens.refresh_token, { path: '/', httpOnly: true });

  // close popup + notify parent
  return new Response(
    `<script>
       window.opener.postMessage({ type: 'coinbase-oauth-success' }, window.location.origin);
       window.close();
     </script>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}
