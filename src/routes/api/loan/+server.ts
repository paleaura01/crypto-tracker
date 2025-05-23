import type { RequestHandler } from './$types';
import { supabaseServer } from '$lib/server/supabaseServer';

export const POST: RequestHandler = async ({ request, locals }) => {
  const session = locals.session;
  if (!session?.user) {
    console.log('🚫 /api/loan unauthorized:', locals.session);
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const userId = session.user.id;
  const { collateral, borrowed } = await request.json();
  console.log('📡 /api/loan payload:', { userId, collateral, borrowed });

  const { error } = await supabaseServer
    .from('loan_calculations')
    .upsert(
      { user_id: userId, collateral_btc: collateral, borrowed_usdc: borrowed },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('❌ Server upsert error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  console.log('✅ Server upsert succeeded for user', userId);
  return new Response(null, { status: 204 });
};
