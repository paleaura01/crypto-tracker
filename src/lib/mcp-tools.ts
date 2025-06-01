/**
 * Server-side MCP tools for accessing Supabase via f1e functions
 * This module provides the actual MCP integration for database operations
 */

interface MCPExecuteParams {
    project_id: string;
    query: string;
}

interface MCPApplyMigrationParams {
    project_id: string;
    name: string;
    query: string;
}

/**
 * Execute SQL query via f1e_execute_sql MCP tool
 * This is a server-side implementation that calls the actual MCP tools
 */
export async function f1e_execute_sql(params: MCPExecuteParams): Promise<unknown[]> {
    try {
        console.log('Attempting to execute SQL via MCP fallback:', params);
        
        // Import SvelteKit environment variables
        const { env } = await import('$env/dynamic/private');
        
        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Supabase environment variables not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
        }
        
        // Fallback to direct Supabase client
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            env.SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY
        );

        // For SELECT queries, use the execute_sql function
        if (params.query.trim().toUpperCase().startsWith('SELECT')) {
            const { data, error } = await supabase
                .rpc('execute_sql', { query_text: params.query });

            if (error) {
                throw new Error(`SQL execution failed: ${error.message}`);
            }

            return data || [];
        } else {
            // For non-SELECT queries, throw an error - these should use specific methods
            throw new Error('INSERT/UPDATE/DELETE operations should use specific Supabase client methods, not raw SQL');
        }

    } catch (error) {
        console.error('f1e_execute_sql error:', error);
        throw error;
    }
}

/**
 * Insert or update wallet address using Supabase client methods
 */
export async function upsertWalletAddress(userId: string, address: string, label: string): Promise<void> {
    try {
        const { env } = await import('$env/dynamic/private');
        
        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Supabase environment variables not configured');
        }
        
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

        const { error } = await supabase
            .from('wallet_addresses')
            .upsert({
                user_id: userId,
                address: address,
                blockchain: 'ethereum',
                label: label,
                is_active: true
            }, {
                onConflict: 'user_id,address,blockchain'
            });

        if (error) {
            throw new Error(`Failed to upsert wallet address: ${error.message}`);
        }
    } catch (error) {
        console.error('upsertWalletAddress error:', error);
        throw error;
    }
}

/**
 * Delete wallet address using Supabase client methods
 */
export async function deleteWalletAddress(userId: string, address: string): Promise<void> {
    try {
        const { env } = await import('$env/dynamic/private');
        
        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Supabase environment variables not configured');
        }
        
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

        const { error } = await supabase
            .from('wallet_addresses')
            .delete()
            .eq('user_id', userId)
            .eq('address', address);

        if (error) {
            throw new Error(`Failed to delete wallet address: ${error.message}`);
        }
    } catch (error) {
        console.error('deleteWalletAddress error:', error);
        throw error;
    }
}

/**
 * Upsert wallet settings using Supabase client methods
 */
export async function upsertWalletSettings(userId: string, settingsType: string, settingsData: unknown): Promise<void> {
    try {
        const { env } = await import('$env/dynamic/private');
        
        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Supabase environment variables not configured');
        }
        
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

        const { error } = await supabase
            .from('wallet_settings')
            .upsert({
                user_id: userId,
                settings_type: settingsType,
                settings_data: settingsData
            }, {
                onConflict: 'user_id,settings_type'
            });

        if (error) {
            throw new Error(`Failed to upsert wallet settings: ${error.message}`);
        }
    } catch (error) {
        console.error('upsertWalletSettings error:', error);
        throw error;
    }
}

/**
 * Apply database migration via f1e_apply_migration MCP tool
 */
export async function f1e_apply_migration(params: MCPApplyMigrationParams): Promise<boolean> {
    try {
        // For migrations, we'll use direct execution since they often contain DDL
        const { env } = await import('$env/dynamic/private');
        
        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Supabase environment variables not configured');
        }
        
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

        const { error } = await supabase.rpc('execute_sql', { query_text: params.query });

        if (error) {
            throw new Error(`Migration failed: ${error.message}`);
        }

        console.log(`✅ Applied migration: ${params.name}`);
        return true;

    } catch (error) {
        console.error(`❌ Migration failed: ${params.name}`, error);
        throw error;
    }
}

/**
 * List database tables via f1e_list_tables MCP tool
 */
export async function f1e_list_tables(params: { project_id: string }): Promise<unknown[]> {
    try {
        const query = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;

        return await f1e_execute_sql({
            project_id: params.project_id,
            query
        });

    } catch (error) {
        console.error('f1e_list_tables error:', error);
        throw new Error(`Failed to list tables: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Test MCP connection
 */
export async function testMCPConnection(projectId: string): Promise<boolean> {
    try {
        const result = await f1e_execute_sql({
            project_id: projectId,
            query: 'SELECT 1 as test'
        });

        return result && result.length > 0;
    } catch {
        return false;
    }
}
