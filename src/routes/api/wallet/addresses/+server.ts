import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseServer } from '$lib/server/supabaseServer.js';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    // Get the current user from session
    const session = locals.session;
    if (!session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all addresses for this user
    const { data: addresses, error } = await supabaseServer
      .from('wallet_addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return json({ error: 'Failed to fetch addresses' }, { status: 500 });
    }

    return json({ 
      success: true, 
      data: addresses || []
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ success: false, error: message }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
  try {
    const { addressId } = await request.json();
    
    if (!addressId) {
      return json({ error: 'Address ID is required' }, { status: 400 });
    }

    // Get the current user from session
    const session = locals.session;
    if (!session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;

    // Soft delete the address (mark as inactive)
    const { error } = await supabaseServer
      .from('wallet_addresses')
      .update({ is_active: false })
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) {
      return json({ error: 'Failed to remove address' }, { status: 500 });
    }

    return json({ 
      success: true, 
      message: 'Address removed successfully'
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ success: false, error: message }, { status: 500 });
  }
};
