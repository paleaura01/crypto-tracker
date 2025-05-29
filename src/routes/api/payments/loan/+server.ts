import type { RequestHandler } from './$types';
import { supabaseServer } from '$lib/server/supabaseServer';

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = locals.session;
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });  }

  const userId = session.user.id;
  const { collateral, borrowed } = await request.json();

  const { error } = await supabaseServer
    .from('loan_calculations')
    .upsert(
      { user_id: userId, collateral_btc: collateral, borrowed_usdc: borrowed },
      { onConflict: 'user_id' }
    );

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(null, { status: 204 });
};
