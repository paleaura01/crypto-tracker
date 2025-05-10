// src/routes/api/cb/oauth2/callback/+server.js
import { Buffer } from 'buffer';
import { json }   from '@sveltejs/kit';
import {
  COINBASE_CLIENT_ID,
  COINBASE_CLIENT_SECRET,
  COINBASE_REDIRECT_URI
} from '$env/static/private';

export async function GET({ url }) {
  const code = url.searchParams.get('code');
  if (!code) {
    return json({ error: 'Missing code' }, { status: 400 });
  }

  // 1) Exchange code for tokens 🔑
  const form = new URLSearchParams({
    grant_type:   'authorization_code',
    code,
    redirect_uri: COINBASE_REDIRECT_URI
  });

  const tokRes = await fetch('https://api.coinbase.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' +
        Buffer
          .from(`${COINBASE_CLIENT_ID}:${COINBASE_CLIENT_SECRET}`)
          .toString('base64')
    },
    body: form.toString()
  });

  // safely read it as text first
  const tokText = await tokRes.text();

  // if it doesn’t look like JSON, bail
  if (!tokText.trim().startsWith('{')) {
    console.error('Token endpoint returned non-JSON:', tokText);
    return new Response('Token exchange failed', { status: tokRes.status });
  }

  const tokens = JSON.parse(tokText);
  if (!tokRes.ok) {
    console.error('Token exchange error payload:', tokens);
    return json({ error: tokens }, { status: tokRes.status });
  }

  // 2) Immediately fetch your account balances
  const acctRes = await fetch('https://api.coinbase.com/v2/accounts', {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });
  const acctText = await acctRes.text();

  if (!acctText.trim().startsWith('{')) {
    console.error('Accounts endpoint returned non-JSON:', acctText);
    return new Response('Failed to fetch balances', { status: acctRes.status });
  }

  const acctJson = JSON.parse(acctText);
  if (!acctRes.ok) {
    console.error('Accounts fetch error payload:', acctJson);
    return json({ error: acctJson }, { status: acctRes.status });
  }

  const balances = acctJson.data || acctJson;

  // 3) Send them back to the opener & close
  return new Response(
    `<!DOCTYPE html><body>
       <script>
         window.opener.postMessage(
           { type: 'coinbase-oauth-success', balances: ${JSON.stringify(balances)} },
           window.location.origin
         );
         window.close();
       <\/script>
     </body>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}
