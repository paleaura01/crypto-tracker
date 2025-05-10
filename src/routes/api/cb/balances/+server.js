import { json }           from '@sveltejs/kit';
import fetch              from 'node-fetch';
import { makeJwt }        from '$lib/server/cb-jwt';
import { CB_API_HOST, CB_API_PATH, CB_VERSION } from '$env/static/private';

export async function GET() {
  const token = await makeJwt(CB_API_PATH);
  const res   = await fetch(`https://${CB_API_HOST}${CB_API_PATH}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'CB-VERSION':   CB_VERSION
    }
  });
  const text = await res.text();
  if (!res.ok) {
    return json({ error:'fetch_failed', detail:text }, { status: res.status });
  }
  const { accounts } = JSON.parse(text);
  // return only non-zero for brevity
  return json(accounts.filter(a=>+a.available_balance.value > 0));
}
