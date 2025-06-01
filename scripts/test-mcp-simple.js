/**
 * Simple MCP Integration Test
 * Tests all wallet operations through the hybrid MCP endpoint
 */

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

async function runTest() {
    console.log('🚀 Starting MCP Integration Test\n');

    // Test 1: Connection
    const connectionTest = await testMCPOperation('test_connection');
    
    // Test 2: Load wallets
    const loadTest = await testMCPOperation('load_wallets');
    
    // Test 3: Save wallet
    const testWallet = {
        id: `test-mcp-${Date.now()}`,
        label: 'Test Wallet',
        address: `0xTest${Date.now().toString().slice(-6)}`,
        expanded: false
    };
    
    const saveTest = await testMCPOperation('save_wallet', { wallet: testWallet });
    
    // Test 4: Load again to verify
    const loadAfterSave = await testMCPOperation('load_wallets');
    
    // Test 5: Delete wallet
    const deleteTest = await testMCPOperation('delete_wallet', {
        walletId: testWallet.id,
        address: testWallet.address
    });
    
    // Test 6: Final load
    const finalLoad = await testMCPOperation('load_wallets');
    
    console.log('\n🎯 SUMMARY:');
    console.log(`Connection: ${connectionTest.success ? '✅' : '❌'}`);
    console.log(`Load: ${loadTest.success ? '✅' : '❌'}`);
    console.log(`Save: ${saveTest.success ? '✅' : '❌'}`);
    console.log(`Delete: ${deleteTest.success ? '✅' : '❌'}`);
    
    const allPassed = [connectionTest, loadTest, saveTest, deleteTest].every(t => t.success);
    console.log(`\n${allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED'}`);
}

runTest().catch(console.error);
