#!/usr/bin/env node

/**
 * MCP Integration Test
 * Tests the real MCP implementation with the crypto-tracker database
 */

const PROJECT_ID = 'usmcnnvgdntpxjhhhplt';
const TEST_USER_ID = 'eb0e5944-30a6-4b37-a12e-e3f99dc5db14';

async function testMCPIntegration() {
    console.log('🧪 Testing MCP Integration for Crypto Tracker...');
    console.log('');

    try {
        // Test 1: Connection Test
        console.log('1️⃣ Testing MCP connection...');
        const response = await fetch('http://localhost:5173/api/mcp/supabase-query-mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operation: 'test_connection' })
        });

        const connectionResult = await response.json();
        
        if (!connectionResult.success) {
            throw new Error('MCP connection test failed');
        }
        
        console.log('   ✅ MCP connection working');
        console.log('   📊 Method:', connectionResult.method);

        // Test 2: Load existing wallets
        console.log('');
        console.log('2️⃣ Testing wallet loading...');
        const loadResponse = await fetch('http://localhost:5173/api/mcp/supabase-query-mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operation: 'load_wallets' })
        });

        const loadResult = await loadResponse.json();
        
        if (!loadResult.success) {
            throw new Error('Wallet loading failed');
        }
        
        console.log('   ✅ Wallet loading working');
        console.log('   📊 Loaded wallets:', loadResult.wallets?.length || 0);
        console.log('   📋 Method:', loadResult.method);

        // Test 3: Save a new test wallet
        console.log('');
        console.log('3️⃣ Testing wallet saving...');
        
        const testWallet = {
            id: 'mcp-integration-test-' + Date.now(),
            label: 'MCP Integration Test Wallet',
            address: '0xMCPTEST' + Date.now().toString(16).slice(-8),
            expanded: true,
            symbolOverrides: { 'TEST': 'TESTCOIN' },
            addressOverrides: {}
        };

        const saveResponse = await fetch('http://localhost:5173/api/mcp/supabase-query-mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                operation: 'save_wallet',
                wallet: testWallet
            })
        });

        const saveResult = await saveResponse.json();
        
        if (!saveResult.success) {
            throw new Error('Wallet saving failed');
        }
        
        console.log('   ✅ Wallet saving working');
        console.log('   📊 Saved wallet:', testWallet.label);
        console.log('   📋 Method:', saveResult.method);

        // Test 4: Load again to verify save
        console.log('');
        console.log('4️⃣ Testing persistence...');
        const verifyResponse = await fetch('http://localhost:5173/api/mcp/supabase-query-mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operation: 'load_wallets' })
        });

        const verifyResult = await verifyResponse.json();
        const savedWallet = verifyResult.wallets?.find(w => w.id === testWallet.id);
        
        if (!savedWallet) {
            throw new Error('Wallet persistence verification failed');
        }
        
        console.log('   ✅ Wallet persistence verified');
        console.log('   📊 Found saved wallet:', savedWallet.label);

        // Test 5: Delete the test wallet
        console.log('');
        console.log('5️⃣ Testing wallet deletion...');
        const deleteResponse = await fetch('http://localhost:5173/api/mcp/supabase-query-mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                operation: 'delete_wallet',
                walletId: testWallet.id,
                address: testWallet.address
            })
        });

        const deleteResult = await deleteResponse.json();
        
        if (!deleteResult.success) {
            throw new Error('Wallet deletion failed');
        }
        
        console.log('   ✅ Wallet deletion working');
        console.log('   📋 Method:', deleteResult.method);

        // Final summary
        console.log('');
        console.log('🎉 MCP Integration Test Complete!');
        console.log('');
        console.log('📊 Test Results:');
        console.log('   ✅ Connection test: PASSED');
        console.log('   ✅ Wallet loading: PASSED');
        console.log('   ✅ Wallet saving: PASSED');
        console.log('   ✅ Data persistence: PASSED');
        console.log('   ✅ Wallet deletion: PASSED');
        console.log('');
        console.log('🔧 MCP Infrastructure Status:');
        console.log('   ✅ Real f1e_execute_sql integration');
        console.log('   ✅ Database operations via MCP');
        console.log('   ✅ Full wallet persistence working');
        console.log('');
        console.log('💡 Your MCP system is fully operational!');

    } catch (error) {
        console.error('❌ MCP Integration test failed:', error);
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('   1. Make sure dev server is running (npm run dev)');
        console.log('   2. Check MCP server configuration');
        console.log('   3. Verify database connectivity');
        process.exit(1);
    }
}

// Run the test
testMCPIntegration();
