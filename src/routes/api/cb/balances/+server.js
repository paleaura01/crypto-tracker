// src/routes/api/cb/balances/+server.js
import { json } from '@sveltejs/kit';

export async function GET({ cookies }) {
  const token = cookies.get('cb_access_token');
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch('https://api.coinbase.com/v2/accounts', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return json({ error: 'Failed fetching balances' }, { status: res.status });
  return json(await res.json());
}
