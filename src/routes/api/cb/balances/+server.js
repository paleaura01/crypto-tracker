import { json }           from '@sveltejs/kit';
import fetch              from 'node-fetch';
import { makeJwt }        from '$lib/server/cb-jwt';
import { CB_API_HOST }    from '$env/static/private';

export async function GET() {
  const token = await makeJwt(); // defaults to CB_API_PATH
  const res   = await fetch(`https://${CB_API_HOST}/api/v3/brokerage/accounts`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'CB-VERSION': '2025-01-01'
    }
  });
  const text = await res.text();
  if (!res.ok) return json({ error:'fetch_failed', detail:text }, { status: res.status });
  const { accounts } = JSON.parse(text);
  return json(accounts.filter(a=>+a.available_balance.value>0));
}
