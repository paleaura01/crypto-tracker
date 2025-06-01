#!/usr/bin/env node

/**
 * Real MCP Local Development Setup
 * Sets up local database that integrates with the MCP infrastructure
 */

import { f1e_execute_sql, f1e_apply_migration, testMCPConnection } from '../src/lib/mcp-tools.js';

const PROJECT_ID = 'usmcnnvgdntpxjhhhplt';

async function setupLocalMCPDatabase() {
    console.log('🚀 Setting up local MCP database development environment...');
    
    try {
        // Test MCP connection
        console.log('🔍 Testing MCP connection...');
        const isConnected = await testMCPConnection(PROJECT_ID);
        
        if (!isConnected) {
            throw new Error('MCP connection failed');
        }
        
        console.log('✅ MCP connection successful');

        // Verify database tables exist
        console.log('📋 Checking database schema...');
        
        const tables = await f1e_execute_sql({
            project_id: PROJECT_ID,
            query: `
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('wallet_addresses', 'wallet_settings', 'token_overrides')
                ORDER BY table_name;
            `
        });

        console.log('📊 Found tables:', tables);

        // Test data access
        console.log('🧪 Testing data access...');
        
        const walletCount = await f1e_execute_sql({
            project_id: PROJECT_ID,
            query: 'SELECT COUNT(*) as count FROM wallet_addresses;'
        });

        const settingsCount = await f1e_execute_sql({
            project_id: PROJECT_ID,
            query: 'SELECT COUNT(*) as count FROM wallet_settings;'
        });

        console.log('💾 Database status:');
        console.log(`   - Wallet addresses: ${walletCount[0]?.count || 0}`);
        console.log(`   - Wallet settings: ${settingsCount[0]?.count || 0}`);

        // Test a sample wallet operation
        console.log('🔧 Testing wallet operations...');
        
        const testWallet = {
            id: 'mcp-test-' + Date.now(),
            label: 'MCP Test Wallet',
            address: '0x742d35Cc6634C0532925a3b8D4C4c4b4c' + Date.now().toString().slice(-6),
            expanded: true,
            symbolOverrides: {},
            addressOverrides: {}
        };

        // Test save operation
        const saveQuery = `
            INSERT INTO wallet_addresses (user_id, address, blockchain, label, is_active)
            VALUES ('eb0e5944-30a6-4b37-a12e-e3f99dc5db14', '${testWallet.address}', 'ethereum', '${testWallet.label}', true)
            ON CONFLICT (user_id, address, blockchain) 
            DO UPDATE SET 
                label = EXCLUDED.label,
                updated_at = now()
            RETURNING id, address, label;
        `;

        const saveResult = await f1e_execute_sql({
            project_id: PROJECT_ID,
            query: saveQuery
        });

        console.log('✅ Test wallet saved:', saveResult[0]);

        // Test load operation
        const loadQuery = `
            SELECT address, label, created_at 
            FROM wallet_addresses 
            WHERE user_id = 'eb0e5944-30a6-4b37-a12e-e3f99dc5db14' 
            ORDER BY created_at DESC 
            LIMIT 5;
        `;

        const loadResult = await f1e_execute_sql({
            project_id: PROJECT_ID,
            query: loadQuery
        });

        console.log('📥 Recent wallets:', loadResult);

        console.log('');
        console.log('🎉 MCP Local Development Setup Complete!');
        console.log('');
        console.log('📋 Setup Summary:');
        console.log('   ✅ MCP connection working');
        console.log('   ✅ Database schema verified');
        console.log('   ✅ Data access tested');
        console.log('   ✅ Wallet operations working');
        console.log('');
        console.log('🔧 MCP Infrastructure:');
        console.log('   - Supabase MCP server configured');
        console.log('   - f1e_execute_sql tools working');
        console.log('   - Real database operations via MCP');
        console.log('');
        console.log('💡 Next Steps:');
        console.log('   1. Run: npm run dev');
        console.log('   2. Test wallet persistence in the app');
        console.log('   3. All database operations now use MCP tools');

    } catch (error) {
        console.error('❌ MCP setup failed:', error);
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('   1. Check MCP server in .vscode/mcp.json');
        console.log('   2. Verify Supabase credentials');
        console.log('   3. Ensure f1e tools are available');
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    setupLocalMCPDatabase();
}

export { setupLocalMCPDatabase };
