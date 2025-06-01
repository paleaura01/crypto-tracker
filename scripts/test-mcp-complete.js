#!/usr/bin/env node
/**
 * Comprehensive MCP Integration Test
 * Tests all wallet operations through the hybrid MCP endpoint
 */

// Use dynamic import for fetch if not available globally
const fetch = globalThis.fetch || (await import('node-fetch')).default;
const BASE_URL = 'http://localhost:5173';

async function testMCPOperation(operation, data = {}) {
    const url = `${BASE_URL}/api/mcp/supabase-query-mcp`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operation, ...data })
        });

        const result = await response.json();
        
        console.log(`\n📊 Operation: ${operation}`);
        console.log(`✅ Status: ${response.ok ? 'OK' : 'ERROR'} (${response.status})`);
        console.log(`📄 Response:`, JSON.stringify(result, null, 2));
        
        return { success: response.ok && result.success, data: result };
    } catch (error) {
        console.log(`\n❌ Operation: ${operation}`);
        console.log(`💥 Error:`, error.message);
        return { success: false, error: error.message };
    }
}

async function runComprehensiveTest() {
    console.log('🚀 Starting Comprehensive MCP Integration Test\n');
    console.log('=' .repeat(60));

    // Test 1: Connection Test
    console.log('\n🔌 Test 1: MCP Connection');
    const connectionTest = await testMCPOperation('test_connection');
    
    if (!connectionTest.success) {
        console.log('❌ Connection test failed. Aborting tests.');
        return;
    }    // Test 2: Load existing wallets
    console.log('\n📂 Test 2: Load Wallets (Initial)');
    const initialLoad = await testMCPOperation('load_wallets');
    const initialCount = initialLoad.data.wallets?.length || 0;
    console.log(`📊 Initial wallet count: ${initialCount}`);

    // Test 3: Save a new test wallet
    console.log('\n💾 Test 3: Save New Wallet');
    const testWallet = {
        id: `test-mcp-${Date.now()}`,
        label: 'Comprehensive Test Wallet',
        address: `0xTestMCP${Date.now().toString().slice(-8)}`,
        expanded: false,
        symbolOverrides: { 'ETH': 'ETHEREUM' },
        addressOverrides: {}
    };
    
    const saveResult = await testMCPOperation('save_wallet', { wallet: testWallet });    // Test 4: Verify wallet was saved
    console.log('\n📂 Test 4: Load Wallets (After Save)');
    const afterSaveLoad = await testMCPOperation('load_wallets');
    const afterSaveCount = afterSaveLoad.data.wallets?.length || 0;
    console.log(`📊 Wallet count after save: ${afterSaveCount}`);
    
    if (afterSaveCount === initialCount + 1) {
        console.log('✅ Save operation verified - wallet count increased by 1');
    } else {
        console.log('❌ Save operation failed - wallet count did not increase');
    }

    // Test 5: Update the wallet (save again with changes)
    console.log('\n🔄 Test 5: Update Wallet');
    const updatedWallet = {
        ...testWallet,
        label: 'Updated Test Wallet',
        expanded: true,
        symbolOverrides: { 'ETH': 'ETHEREUM', 'BTC': 'BITCOIN' }
    };
    
    const updateResult = await testMCPOperation('save_wallet', { wallet: updatedWallet });    // Test 6: Verify wallet was updated (count should stay the same)
    console.log('\n📂 Test 6: Load Wallets (After Update)');
    const afterUpdateLoad = await testMCPOperation('load_wallets');
    const afterUpdateCount = afterUpdateLoad.data.wallets?.length || 0;
    console.log(`📊 Wallet count after update: ${afterUpdateCount}`);
    
    if (afterUpdateCount === afterSaveCount) {
        console.log('✅ Update operation verified - wallet count remained the same');        // Check if the wallet data was actually updated
        const wallets = afterUpdateLoad.data.wallets || [];
        const updatedWalletData = wallets.find(w => w.id === testWallet.id);
        
        if (updatedWalletData && updatedWalletData.label === 'Updated Test Wallet') {
            console.log('✅ Wallet data successfully updated');
        } else {
            console.log('❌ Wallet data was not updated properly');
        }
    } else {
        console.log('❌ Update operation failed - wallet count changed unexpectedly');
    }

    // Test 7: Delete the test wallet
    console.log('\n🗑️ Test 7: Delete Wallet');
    const deleteResult = await testMCPOperation('delete_wallet', {
        walletId: testWallet.id,
        address: testWallet.address
    });    // Test 8: Verify wallet was deleted
    console.log('\n📂 Test 8: Load Wallets (After Delete)');
    const afterDeleteLoad = await testMCPOperation('load_wallets');
    const afterDeleteCount = afterDeleteLoad.data.wallets?.length || 0;
    console.log(`📊 Wallet count after delete: ${afterDeleteCount}`);
    
    if (afterDeleteCount === initialCount) {
        console.log('✅ Delete operation verified - wallet count returned to initial value');
    } else {
        console.log('❌ Delete operation failed - wallet count did not return to initial value');
    }

    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('=' .repeat(60));
    
    const tests = [
        { name: 'Connection Test', success: connectionTest.success },
        { name: 'Initial Load', success: initialLoad.success },
        { name: 'Save Wallet', success: saveResult.success },
        { name: 'Verify Save', success: afterSaveCount === initialCount + 1 },
        { name: 'Update Wallet', success: updateResult.success },
        { name: 'Verify Update', success: afterUpdateCount === afterSaveCount },
        { name: 'Delete Wallet', success: deleteResult.success },
        { name: 'Verify Delete', success: afterDeleteCount === initialCount }
    ];
    
    const passedTests = tests.filter(t => t.success).length;
    const totalTests = tests.length;
    
    tests.forEach(test => {
        console.log(`${test.success ? '✅' : '❌'} ${test.name}`);
    });
    
    console.log(`\n🎯 Test Results: ${passedTests}/${totalTests} passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED! MCP integration is working perfectly!');
    } else {
        console.log('⚠️ Some tests failed. Please check the implementation.');
    }
    
    console.log('\n📊 Database State:');
    console.log(`   Initial wallets: ${initialCount}`);
    console.log(`   Final wallets: ${afterDeleteCount}`);
    console.log(`   State preserved: ${initialCount === afterDeleteCount ? 'YES' : 'NO'}`);
}

// Run the test
runComprehensiveTest().catch(console.error);
