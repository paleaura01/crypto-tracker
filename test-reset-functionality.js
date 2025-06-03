// Quick test script to verify reset functionality works
import { createClient } from '@supabase/supabase-js';

const PUBLIC_SUPABASE_URL = 'https://usmcnnvgdntpxjhhhplt.supabase.co';
const PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzbWNubnZnZG50cHhqaGhocGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4NzM5NDUsImV4cCI6MjA1NTQ0OTk0NX0.sALw7L5LHfg6kxQNRHZF-u_rPu-MXmRoFTLGKq7iayg';

const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

// Test wallet and credentials
const testWallet = '0xbaC4412fA1Be857b5F7be980370C95317fa5458d';
const testEmail = 'cryptotracker.test.user@gmail.com';
const testPassword = 'securepassword123!';

async function testResetFunctionality() {
  try {
    console.log('🔐 Signing in...');
    const { data: { user, session }, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError || !session) {
      throw new Error(`Sign in failed: ${signInError?.message}`);
    }
    
    console.log('✅ Signed in successfully');
    
    // First, verify current state
    console.log('📊 Checking current overrides...');
    const getResponse = await fetch(`http://localhost:5173/api/overrides?wallet_address=${encodeURIComponent(testWallet)}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    if (!getResponse.ok) {
      throw new Error(`GET failed: ${getResponse.status}`);
    }
    
    const currentOverrides = await getResponse.json();
    console.log('Current symbol overrides:', currentOverrides.symbolOverrides);
    
    // Test individual symbol deletion
    const symbolsToDelete = Object.keys(currentOverrides.symbolOverrides || {});
    
    if (symbolsToDelete.length === 0) {
      console.log('⚠️ No symbol overrides found to test reset functionality');
      return;
    }
    
    console.log(`🗑️ Testing deletion of ${symbolsToDelete.length} symbol overrides...`);
    
    for (const symbol of symbolsToDelete) {
      console.log(`  Deleting symbol override: ${symbol}`);
      
      const deleteResponse = await fetch('http://localhost:5173/api/overrides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          contractAddress: '', // Empty for symbol overrides
          chain: 'eth',
          overrideType: 'symbol',
          overrideValue: null,
          walletAddress: testWallet,
          action: 'delete',
          symbol: symbol
        })
      });
      
      const deleteResult = await deleteResponse.json();
      
      if (!deleteResponse.ok || !deleteResult.success) {
        console.error(`❌ Failed to delete ${symbol}:`, deleteResult);
        throw new Error(`Delete failed for ${symbol}: ${deleteResult.error}`);
      } else {
        console.log(`  ✅ Successfully deleted ${symbol}`);
      }
    }
    
    // Verify all overrides are gone
    console.log('🔍 Verifying overrides are deleted...');
    const verifyResponse = await fetch(`http://localhost:5173/api/overrides?wallet_address=${encodeURIComponent(testWallet)}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    const finalOverrides = await verifyResponse.json();
    const remainingSymbols = Object.keys(finalOverrides.symbolOverrides || {});
    
    if (remainingSymbols.length === 0) {
      console.log('🎉 SUCCESS: All symbol overrides have been reset!');
    } else {
      console.error('❌ FAILURE: Some overrides remain:', remainingSymbols);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testResetFunctionality();
