import { error }        from '@sveltejs/kit';
import fetch            from 'node-fetch';
import { makeJwt }      from '$lib/server/cb-jwt';
import { CB_API_HOST }  from '$env/static/private';

export async function load() {
  // 1) list all
  const listToken = await makeJwt();
  const listRes   = await fetch(`https://${CB_API_HOST}/api/v3/brokerage/accounts`, {
    headers:{
      Authorization:`Bearer ${listToken}`,
      'CB-VERSION':'2025-01-01'
    }
  });
  if (!listRes.ok) throw error(listRes.status, 'Could not load accounts');
  const { accounts } = await listRes.json();

  // 2) fetch details for each non-zero balance
  const nonZero = accounts.filter(a=>+a.available_balance.value>0);
  const details = await Promise.all(nonZero.map(async acct => {
    const token = await makeJwt(`/api/v3/brokerage/accounts/${acct.uuid}`);
    const res   = await fetch(
      `https://${CB_API_HOST}/api/v3/brokerage/accounts/${acct.uuid}`,
      { headers:{
          Authorization:`Bearer ${token}`,
          'CB-VERSION':'2025-01-01'
        } }
    );
    if (!res.ok) return { uuid:acct.uuid, error:res.status };
    return (await res.json()).account;
  }));

  return { list: accounts, details };
}
