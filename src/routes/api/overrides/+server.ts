import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';
import type { RequestHandler } from './$types';

// Get user's token overrides
export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: overrides, error } = await supabase
      .from('token_overrides')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      return json({ error: 'Failed to fetch overrides' }, { status: 500 });
    }

    // Transform to the format expected by the frontend
    const addressOverrides: Record<string, string | null> = {};
    const symbolOverrides: Record<string, string | null> = {};

    overrides.forEach(override => {
      const key = override.contract_address;
      if (override.override_type === 'address') {
        addressOverrides[key] = override.override_value;
      } else if (override.override_type === 'symbol') {
        symbolOverrides[key] = override.override_value;
      }
    });

    return json({
      addressOverrides,
      symbolOverrides
    });

  } catch {
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// Save or update token overrides
export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      contractAddress, 
      chain = 'eth',
      overrideType, 
      overrideValue 
    } = await request.json();

    if (!contractAddress || !overrideType) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['address', 'symbol'].includes(overrideType)) {
      return json({ error: 'Invalid override type' }, { status: 400 });
    }

    // If overrideValue is null, delete the override
    if (overrideValue === null) {
      const { error } = await supabase
        .from('token_overrides')
        .delete()
        .eq('user_id', user.id)
        .eq('contract_address', contractAddress)
        .eq('chain', chain)
        .eq('override_type', overrideType);

      if (error) {
        return json({ error: 'Failed to delete override' }, { status: 500 });
      }
    } else {
      // Upsert the override
      const { error } = await supabase
        .from('token_overrides')
        .upsert({
          user_id: user.id,
          contract_address: contractAddress,
          chain,
          override_type: overrideType,
          override_value: overrideValue,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,contract_address,chain,override_type'
        });

      if (error) {
        return json({ error: 'Failed to save override' }, { status: 500 });
      }
    }

    return json({ success: true });

  } catch {
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
