import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Get user's token overrides (supports wallet-specific filtering)
export const GET: RequestHandler = async ({ request, url }) => {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create a new Supabase client with the user's access token for proper RLS context
    const { createClient } = await import('@supabase/supabase-js');
    const { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } = await import('$env/static/public');
    
    const userSupabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();

    if (authError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get optional wallet_address parameter for wallet-specific overrides
    const walletAddress = url.searchParams.get('wallet_address');
    const includeGlobal = url.searchParams.get('include_global') !== 'false';

    let query = userSupabase
      .from('token_overrides')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Filter by wallet address if provided
    if (walletAddress) {
      if (includeGlobal) {
        // Include both wallet-specific and global overrides
        query = query.or(`wallet_address.eq.${walletAddress},wallet_address.is.null`);
      } else {
        // Only wallet-specific overrides
        query = query.eq('wallet_address', walletAddress);
      }
    } else if (!includeGlobal) {
      // Only global overrides (null wallet_address)
      query = query.is('wallet_address', null);
    }

    const { data: overrides, error } = await query;

    if (error) {
      return json({ error: 'Failed to fetch overrides' }, { status: 500 });
    }

    // Transform to the format expected by the frontend
    // Group by wallet address for wallet-specific response
    if (walletAddress) {
      const walletOverrides: Record<string, string | null> = {};
      const globalOverrides: Record<string, string | null> = {};
      const addressOverrides: Record<string, string | null> = {};
      const symbolOverrides: Record<string, string | null> = {};      overrides.forEach(override => {
        const isGlobal = override.wallet_address === null;
        
        if (override.override_type === 'address') {
          const key = override.contract_address;
          addressOverrides[key] = override.override_value;
          if (isGlobal) {
            globalOverrides[key] = override.override_value;
          } else {
            walletOverrides[key] = override.override_value;
          }
        } else if (override.override_type === 'symbol') {
          // For symbol overrides, use the symbol as key, fall back to contract_address if symbol is null
          const key = override.symbol || override.contract_address;
          symbolOverrides[key] = override.override_value;
          if (isGlobal) {
            globalOverrides[key] = override.override_value;
          } else {
            walletOverrides[key] = override.override_value;
          }
        }
      });

      return json({
        addressOverrides,
        symbolOverrides,
        walletSpecific: walletOverrides,
        global: globalOverrides,
        walletAddress
      });
    } else {      // Return all overrides grouped by wallet
      const walletGroups: Record<string, { addressOverrides: Record<string, string | null>, symbolOverrides: Record<string, string | null> }> = {};
      const globalOverrides: { addressOverrides: Record<string, string | null>, symbolOverrides: Record<string, string | null> } = { 
        addressOverrides: {}, 
        symbolOverrides: {} 
      };      overrides.forEach(override => {
        const walletAddr = override.wallet_address || 'global';
        
        if (!walletGroups[walletAddr]) {
          walletGroups[walletAddr] = { addressOverrides: {}, symbolOverrides: {} };
        }

        if (override.override_type === 'address') {
          const key = override.contract_address;
          if (walletAddr === 'global') {
            globalOverrides.addressOverrides[key] = override.override_value;
          } else {
            walletGroups[walletAddr].addressOverrides[key] = override.override_value;
          }
        } else if (override.override_type === 'symbol') {
          // For symbol overrides, use the symbol as key, fall back to contract_address if symbol is null
          const key = override.symbol || override.contract_address;
          if (walletAddr === 'global') {
            globalOverrides.symbolOverrides[key] = override.override_value;
          } else {
            walletGroups[walletAddr].symbolOverrides[key] = override.override_value;
          }
        }
      });

      return json({
        walletGroups,
        global: globalOverrides,
        // Legacy format for backward compatibility
        addressOverrides: globalOverrides.addressOverrides,
        symbolOverrides: globalOverrides.symbolOverrides
      });
    }
  } catch {
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// Save or update token overrides (supports wallet-specific operations)
export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create a new Supabase client with the user's access token for proper RLS context
    const { createClient } = await import('@supabase/supabase-js');
    const { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } = await import('$env/static/public');
    
    const userSupabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();

    if (authError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }    const { 
      contractAddress, 
      chain = 'eth',
      overrideType, 
      overrideValue,
      walletAddress = null, // New: wallet-specific override
      walletId = null,      // New: reference to wallets table
      action = 'upsert',    // New: operation type (upsert, delete, bulk_delete)
      symbol = null         // New: symbol name for symbol overrides
    } = await request.json();

    // Validate action type first
    if (!['upsert', 'delete', 'bulk_delete'].includes(action)) {
      return json({ error: 'Invalid action type' }, { status: 400 });
    }

    // Handle bulk delete operation (remove all overrides for a wallet)
    if (action === 'bulk_delete') {
      if (!walletAddress) {
        return json({ error: 'Wallet address required for bulk delete' }, { status: 400 });
      }

      // Soft delete all overrides for this wallet using the authenticated client
      const { error: bulkDeleteError } = await userSupabase
        .from('token_overrides')
        .update({ 
          is_active: false,
          action: 'delete',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('wallet_address', walletAddress)
        .eq('is_active', true);

      if (bulkDeleteError) {
        return json({ error: 'Failed to bulk delete overrides' }, { status: 500 });
      }

      // Update token holdings to reflect the override removal
      await updateTokenHoldingsAfterOverride(userSupabase, user.id, walletAddress, null, null, 'bulk_delete');

      return json({ 
        success: true, 
        action: 'bulk_delete',
        message: `All overrides removed for wallet ${walletAddress}`
      });
    }

    // For non-bulk operations, validate override type
    if (!overrideType) {
      return json({ error: 'Missing override type' }, { status: 400 });
    }

    if (!['address', 'symbol'].includes(overrideType)) {
      return json({ error: 'Invalid override type' }, { status: 400 });
    }

    // For symbol overrides, require either symbol or contractAddress to be valid
    if (overrideType === 'symbol' && !symbol && !contractAddress) {
      return json({ error: 'Symbol name or contract address required for symbol overrides' }, { status: 400 });
    }    // For address overrides, require contractAddress
    if (overrideType === 'address' && !contractAddress) {
      return json({ error: 'Contract address required for address overrides' }, { status: 400 });
    }

    // Handle explicit delete operation
    if (action === 'delete') {
      // Build the query for finding the existing override
      let findQuery = userSupabase
        .from('token_overrides')
        .select('*')
        .eq('user_id', user.id)
        .eq('override_type', overrideType)
        .eq('is_active', true);

      // For symbol overrides, search by symbol if provided, otherwise by contract_address
      if (overrideType === 'symbol') {
        if (symbol) {
          findQuery = findQuery.eq('symbol', symbol);
        } else {
          findQuery = findQuery.eq('contract_address', contractAddress);
        }
      } else {
        // For address overrides, always use contract_address
        findQuery = findQuery.eq('contract_address', contractAddress).eq('chain', chain);
      }

      const { data: existingOverride, error: findError } = await findQuery.maybeSingle();

      if (findError) {
        return json({ error: 'Failed to find override' }, { status: 500 });
      }

      if (existingOverride) {
        // Check wallet address matching
        const overrideWalletAddr = existingOverride.wallet_address;
        if (walletAddress !== overrideWalletAddr) {
          return json({ error: 'Override not found for specified wallet' }, { status: 404 });
        }

        // Soft delete the override using the authenticated client
        const { error } = await userSupabase
          .from('token_overrides')
          .update({ 
            is_active: false,
            action: 'delete',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingOverride.id);

        if (error) {
          return json({ error: 'Failed to delete override' }, { status: 500 });
        }

        // Update token holdings
        await updateTokenHoldingsAfterOverride(userSupabase, user.id, walletAddress, contractAddress, chain, 'delete');
      }

      return json({ success: true, action: 'delete' });
    }// Handle upsert operation
    const overrideData = {
      user_id: user.id,
      contract_address: contractAddress,
      chain,
      override_type: overrideType,
      override_value: overrideValue,
      wallet_address: walletAddress,
      wallet_id: walletId,
      symbol: overrideType === 'symbol' ? symbol : null, // Include symbol for symbol overrides
      action: 'create', // Use 'create' instead of 'upsert' for new records
      updated_at: new Date().toISOString(),
      metadata: {
        created_via: 'api',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    };

    // Build the soft delete query based on override type
    let softDeleteQuery = userSupabase
      .from('token_overrides')
      .update({ 
        is_active: false,
        action: 'update',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('override_type', overrideType)
      .eq('is_active', true);

    // For symbol overrides, match by symbol if provided, otherwise by contract_address
    if (overrideType === 'symbol') {
      if (symbol) {
        softDeleteQuery = softDeleteQuery.eq('symbol', symbol);
      } else {
        softDeleteQuery = softDeleteQuery.eq('contract_address', contractAddress);
      }
    } else {
      // For address overrides, match by contract_address and chain
      softDeleteQuery = softDeleteQuery.eq('contract_address', contractAddress).eq('chain', chain);
    }

    // Apply wallet address filter properly
    if (walletAddress) {
      softDeleteQuery = softDeleteQuery.eq('wallet_address', walletAddress);
    } else {
      softDeleteQuery = softDeleteQuery.is('wallet_address', null);
    }
    
    await softDeleteQuery;

    // Insert new override using the authenticated client
    const { data, error } = await userSupabase
      .from('token_overrides')
      .insert(overrideData)
      .select()
      .single();if (error) {
      return json({ error: error.message }, { status: 500 });
    }

    // Update token holdings to reflect the new override
    await updateTokenHoldingsAfterOverride(userSupabase, user.id, walletAddress, contractAddress, chain, 'upsert');

    return json({ 
      success: true, 
      data,
      action: 'upsert',
      walletAddress 
    });

  } catch {
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

// Helper function to update token holdings after override changes
async function updateTokenHoldingsAfterOverride(
  userSupabase: SupabaseClient, // The authenticated Supabase client
  userId: string, 
  walletAddress: string | null, 
  contractAddress: string | null, 
  chain: string | null, 
  action: string
) {
  try {
    if (!walletAddress) return; // Skip for global overrides

    let query = userSupabase
      .from('token_holdings')
      .update({ 
        updated_at: new Date().toISOString(),
        metadata: {
          override_action: action,
          override_updated_at: new Date().toISOString(),
          needs_refresh: true
        }
      })
      .eq('user_id', userId)
      .eq('wallet_address', walletAddress);

    // Filter by specific contract if provided
    if (contractAddress && chain) {
      query = query
        .eq('contract_address', contractAddress)
        .eq('chain', chain);
    }

    await query;
  } catch {
    // ignore errors in background operation
  }
}
