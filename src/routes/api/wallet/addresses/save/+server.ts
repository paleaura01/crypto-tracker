import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseServer } from '$lib/server/supabaseServer.js';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { address, label, blockchain = 'ethereum' } = await request.json();
    
    if (!address) {
      return json({ error: 'Address is required' }, { status: 400 });
    }

    // Get the current user from session
    const session = locals.session;
    if (!session?.user) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.id;    // Check if address already exists for this user
    const { data: existingAddress } = await supabaseServer
      .from('wallet_addresses')
      .select('id')
      .eq('user_id', userId)
      .eq('address', address.toLowerCase())
      .eq('blockchain', blockchain)
      .single();

    if (existingAddress) {
      return json({ error: 'Address already saved' }, { status: 409 });
    }

    // Save the address
    const { data, error } = await supabaseServer
      .from('wallet_addresses')
      .insert({
        user_id: userId,
        address: address.toLowerCase(),
        blockchain,
        label: label || null,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      return json({ error: 'Failed to save address' }, { status: 500 });
    }

    return json({ 
      success: true, 
      message: 'Address saved successfully',
      data 
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ success: false, error: message }, { status: 500 });
  }
};
