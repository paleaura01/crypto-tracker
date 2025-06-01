// Test localStorage persistence debugging
// This file tests localStorage functionality to debug balance data persistence issues

console.log('🔍 Starting localStorage persistence test...');

// Test 1: Basic localStorage functionality
function testBasicLocalStorage() {
  console.log('📋 Test 1: Basic localStorage functionality');
  
  try {
    const testKey = 'test-localstorage';
    const testData = { test: 'data', timestamp: Date.now() };
    
    // Set data
    localStorage.setItem(testKey, JSON.stringify(testData));
    console.log('✅ Data written to localStorage:', testData);
    
    // Get data
    const retrieved = JSON.parse(localStorage.getItem(testKey) || 'null');
    console.log('✅ Data retrieved from localStorage:', retrieved);
    
    // Clean up
    localStorage.removeItem(testKey);
    
    return retrieved && retrieved.test === testData.test;
  } catch (error) {
    console.error('❌ Basic localStorage test failed:', error);
    return false;
  }
}

// Test 2: Test the exact cache format used by the app
function testBalanceCacheFormat() {
  console.log('📋 Test 2: Balance cache format test');
  
  try {
    const BALANCE_CACHE_PREFIX = 'wallet-balances-';
    const testAddress = '0x1234567890123456789012345678901234567890';
    const balanceKey = `${BALANCE_CACHE_PREFIX}${testAddress.toLowerCase()}`;
    
    const mockBalanceData = [
      {
        token_address: '0xA0b86a33E6441FE0cE29a8Fc8C1CE6bd7ac9C9E',
        symbol: 'ETH',
        name: 'Ethereum',
        balance: '1000000000000000000',
        decimals: 18,
        price_usd: 2000,
        value_usd: 2000
      }
    ];
    
    // Test setCachedData equivalent
    const cacheData = {
      data: mockBalanceData,
      timestamp: Date.now()
    };
    
    localStorage.setItem(balanceKey, JSON.stringify(cacheData));
    console.log('✅ Balance data cached with key:', balanceKey);
    console.log('✅ Cached data structure:', cacheData);
    
    // Test checkCachedData equivalent
    const rawItem = JSON.parse(localStorage.getItem(balanceKey) || 'null');
    if (rawItem?.data) {
      console.log('✅ Balance data retrieved successfully');
      console.log('✅ Retrieved data:', rawItem);
      console.log('✅ Age of cache:', Date.now() - rawItem.timestamp, 'ms');
    } else {
      console.error('❌ Failed to retrieve balance data');
      return false;
    }
    
    // Clean up
    localStorage.removeItem(balanceKey);
    
    return true;
  } catch (error) {
    console.error('❌ Balance cache test failed:', error);
    return false;
  }
}

// Test 3: Test localStorage persistence across page refresh simulation
function testPersistenceSimulation() {
  console.log('📋 Test 3: Persistence simulation test');
  
  try {
    const testKey = 'persistence-test';
    const testData = {
      wallets: [
        {
          id: 'wallet-123',
          address: '0x1234567890123456789012345678901234567890',
          label: 'Test Wallet',
          balancesLoaded: true
        }
      ],
      timestamp: Date.now()
    };
    
    // Store data
    localStorage.setItem(testKey, JSON.stringify(testData));
    console.log('✅ Test data stored');
    
    // Simulate checking data after page refresh
    const storedData = localStorage.getItem(testKey);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      console.log('✅ Data persisted successfully:', parsed);
      
      // Verify data integrity
      if (parsed.wallets && parsed.wallets.length > 0 && parsed.wallets[0].id === 'wallet-123') {
        console.log('✅ Data integrity verified');
        localStorage.removeItem(testKey);
        return true;
      } else {
        console.error('❌ Data integrity check failed');
        return false;
      }
    } else {
      console.error('❌ No data found after persistence test');
      return false;
    }
  } catch (error) {
    console.error('❌ Persistence simulation test failed:', error);
    return false;
  }
}

// Test 4: Check localStorage limits and quotas
function testLocalStorageQuota() {
  console.log('📋 Test 4: localStorage quota test');
  
  try {
    // Get rough estimate of localStorage usage
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage.getItem(key)?.length || 0;
      }
    }
    
    console.log('✅ Current localStorage usage (approx):', totalSize, 'characters');
    console.log('✅ Available localStorage:', typeof Storage !== 'undefined' ? 'Available' : 'Not available');
    
    // List all localStorage keys
    const keys = Object.keys(localStorage);
    console.log('✅ Current localStorage keys:', keys);
    
    // Check for balance-related keys
    const balanceKeys = keys.filter(key => key.includes('wallet-balances'));
    console.log('✅ Balance cache keys found:', balanceKeys);
    
    if (balanceKeys.length > 0) {
      balanceKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            console.log(`✅ Found balance cache: ${key}`, {
              hasData: !!parsed.data,
              timestamp: new Date(parsed.timestamp).toISOString(),
              age: Date.now() - parsed.timestamp
            });
          } catch {
            console.log(`⚠️ Invalid JSON in balance cache: ${key}`);
          }
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ localStorage quota test failed:', error);
    return false;
  }
}

// Test 5: Check for localStorage event listeners and browser behavior
function testBrowserSpecificBehavior() {
  console.log('📋 Test 5: Browser-specific behavior test');
  
  try {
    console.log('✅ User Agent:', navigator.userAgent);
    console.log('✅ Private browsing detection:', 
      typeof Storage !== 'undefined' && 
      localStorage && 
      typeof localStorage.setItem === 'function' ? 'Normal mode' : 'Possible private mode'
    );
    
    // Test storage event (won't fire in same tab, but helps debug)
    window.addEventListener('storage', (e) => {
      console.log('📢 Storage event detected:', e);
    });
    
    console.log('✅ Storage event listener attached');
    
    return true;
  } catch (error) {
    console.error('❌ Browser behavior test failed:', error);
    return false;
  }
}

// Run all tests
function runAllTests() {
  console.log('🚀 Running localStorage persistence diagnostic tests...\n');
  
  const results = {
    basicLocalStorage: testBasicLocalStorage(),
    balanceCacheFormat: testBalanceCacheFormat(),
    persistenceSimulation: testPersistenceSimulation(),
    localStorageQuota: testLocalStorageQuota(),
    browserBehavior: testBrowserSpecificBehavior()
  };
  
  console.log('\n📊 Test Results Summary:');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall result: ${allPassed ? 'All tests passed' : 'Some tests failed'}`);
  
  if (!allPassed) {
    console.log('\n🔍 Troubleshooting steps:');
    console.log('1. Check if you are in private/incognito browsing mode');
    console.log('2. Verify localStorage is not disabled in browser settings');
    console.log('3. Check if localStorage quota is exceeded');
    console.log('4. Look for browser extensions that might interfere with localStorage');
    console.log('5. Check browser console for any localStorage-related errors');
  }
  
  return results;
}

// Auto-run tests if loaded in browser
if (typeof window !== 'undefined') {
  runAllTests();
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    testBasicLocalStorage,
    testBalanceCacheFormat,
    testPersistenceSimulation,
    testLocalStorageQuota,
    testBrowserSpecificBehavior
  };
}
