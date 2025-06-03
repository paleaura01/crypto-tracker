import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '../routes/api/overrides/+server';

// Mock environment variables
vi.mock('$env/static/public', () => ({
  PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
  PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
}));

// Create a simple mock response queue
const mockResponses: { data: any; error: any }[] = [];

const getNextResponse = () => {
  return mockResponses.shift() || { data: null, error: null };
};

// Create a mock query that can be awaited directly
const createMockQuery = () => {
  const response = getNextResponse();
  
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis()
  };

  // Make it awaitable by returning a promise that resolves to the response
  return Object.assign(Promise.resolve(response), query);
};

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => createMockQuery())
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

// Test data
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com'
};

const mockOverrides = [
  {
    id: 1,
    user_id: 'test-user-123',
    contract_address: '0x0000000000000000000000000000000000001010',
    symbol: 'MATIC',
    chain: 'eth',
    override_type: 'symbol',
    override_value: 'ethereum',
    wallet_address: null,
    is_active: true
  },
  {
    id: 2,
    user_id: 'test-user-123',
    contract_address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    symbol: 'ETH',
    chain: 'eth',
    override_type: 'symbol',
    override_value: null,
    wallet_address: null,
    is_active: true
  },
  {
    id: 3,
    user_id: 'test-user-123',
    contract_address: '0x1234567890abcdef',
    symbol: 'WETH',
    chain: 'eth',
    override_type: 'symbol',
    override_value: '0x678-landwolf-1933',
    wallet_address: null,
    is_active: true
  },
  {
    id: 4,
    user_id: 'test-user-123',
    contract_address: '0xabcdef1234567890',
    symbol: null,
    chain: 'eth',
    override_type: 'address',
    override_value: '0x1234567890abcdef',
    wallet_address: '0xwallet123',
    is_active: true
  }
];

describe('Token Override API - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResponses.length = 0; // Clear response queue
    
    // Setup default mocks
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper function to queue mock responses
  const queueMockResponse = (response: { data: any; error: any }) => {
    mockResponses.push(response);
  };

  describe('GET /api/overrides', () => {
    it('should return unauthorized when no auth header is provided', async () => {
      const request = new Request('http://localhost/api/overrides');
      const url = new URL('http://localhost/api/overrides');
      
      const response = await GET({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return unauthorized when auth fails', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token')
      });

      const request = new Request('http://localhost/api/overrides', {
        headers: { authorization: 'Bearer invalid-token' }
      });
      const url = new URL('http://localhost/api/overrides');
      
      const response = await GET({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return global overrides correctly formatted', async () => {
      queueMockResponse({
        data: mockOverrides.filter(o => o.wallet_address === null),
        error: null
      });

      const request = new Request('http://localhost/api/overrides', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const url = new URL('http://localhost/api/overrides');
      
      const response = await GET({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.symbolOverrides).toEqual({
        'MATIC': 'ethereum',
        'ETH': null,
        'WETH': '0x678-landwolf-1933'
      });
      expect(data.addressOverrides).toEqual({});
    });

    it('should return wallet-specific overrides when wallet_address is provided', async () => {
      const walletAddress = '0xwallet123';
      queueMockResponse({
        data: mockOverrides.filter(o => o.wallet_address === walletAddress || o.wallet_address === null),
        error: null
      });

      const request = new Request('http://localhost/api/overrides', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const url = new URL(`http://localhost/api/overrides?wallet_address=${walletAddress}`);
      
      const response = await GET({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.walletAddress).toBe(walletAddress);
      expect(data.addressOverrides).toEqual({
        '0xabcdef1234567890': '0x1234567890abcdef'
      });
      expect(data.symbolOverrides).toEqual({
        'MATIC': 'ethereum',
        'ETH': null,
        'WETH': '0x678-landwolf-1933'
      });
    });

    it('should handle database errors gracefully', async () => {
      queueMockResponse({
        data: null,
        error: new Error('Database connection failed')
      });

      const request = new Request('http://localhost/api/overrides', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const url = new URL('http://localhost/api/overrides');
        const response = await GET({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch overrides');
    });

    it('should handle mixed symbol and address overrides correctly', async () => {
      const mixedOverrides = [
        ...mockOverrides.filter(o => o.override_type === 'symbol' && o.wallet_address === null),
        ...mockOverrides.filter(o => o.override_type === 'address')
      ];

      queueMockResponse({
        data: mixedOverrides,
        error: null
      });

      const request = new Request('http://localhost/api/overrides', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const url = new URL('http://localhost/api/overrides?wallet_address=0xwallet123');
      
      const response = await GET({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.symbolOverrides).toEqual({
        'MATIC': 'ethereum',
        'ETH': null,
        'WETH': '0x678-landwolf-1933'
      });
      expect(data.addressOverrides).toEqual({
        '0xabcdef1234567890': '0x1234567890abcdef'
      });
    });

    it('should handle overrides without symbol field gracefully', async () => {
      const overridesWithoutSymbol = [
        {
          id: 5,
          user_id: 'test-user-123',
          contract_address: '0x0000000000000000000000000000000000001010',
          symbol: null, // Legacy data without symbol
          chain: 'eth',
          override_type: 'symbol',
          override_value: 'ethereum',
          wallet_address: null,
          is_active: true
        }
      ];

      queueMockResponse({
        data: overridesWithoutSymbol,
        error: null
      });

      const request = new Request('http://localhost/api/overrides', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const url = new URL('http://localhost/api/overrides');
      
      const response = await GET({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      // Should use contract_address as fallback key when symbol is null
      expect(data.symbolOverrides).toEqual({
        '0x0000000000000000000000000000000000001010': 'ethereum'
      });
    });
  });

  describe('POST /api/overrides', () => {
    it('should return unauthorized when no auth header is provided', async () => {
      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },        body: JSON.stringify({
          action: 'upsert',
          overrideType: 'symbol',
          contractAddress: '0x123',
          symbol: 'TEST',
          overrideValue: 'test-token'
        })
      });
      const url = new URL('http://localhost/api/overrides');
      
      const response = await POST({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should validate required fields for symbol overrides', async () => {
      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },        body: JSON.stringify({
          action: 'upsert',
          overrideType: 'symbol'
          // Missing both symbol and contractAddress fields
        })
      });
      const url = new URL('http://localhost/api/overrides');
      
      const response = await POST({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Symbol name or contract address required for symbol overrides');
    });

    it('should validate required fields for address overrides', async () => {
      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },        body: JSON.stringify({
          action: 'upsert',
          overrideType: 'address',
          // Missing contractAddress field
        })
      });
      const url = new URL('http://localhost/api/overrides');
      
      const response = await POST({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Contract address required for address overrides');
    });    it('should handle delete action correctly', async () => {
      // Mock finding an existing override first
      queueMockResponse({
        data: {
          id: 1,
          user_id: 'test-user-123',
          contract_address: '0x123',
          symbol: 'TEST',
          override_type: 'symbol',
          wallet_address: null,
          is_active: true
        },
        error: null
      });

      // Mock successful delete
      queueMockResponse({
        data: null,
        error: null
      });

      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete',
          overrideType: 'symbol',
          contractAddress: '0x123',
          symbol: 'TEST'
        })
      });
      const url = new URL('http://localhost/api/overrides');
      
      const response = await POST({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should validate action type', async () => {
      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          action: 'invalid',
          overrideType: 'symbol',
          contractAddress: '0x123',
          symbol: 'TEST'
        })
      });
      const url = new URL('http://localhost/api/overrides');
      
      const response = await POST({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid action type');
    });

    it('should validate override type', async () => {
      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },        body: JSON.stringify({
          action: 'upsert',
          overrideType: 'invalid',
          contractAddress: '0x123',
          symbol: 'TEST'
        })
      });
      const url = new URL('http://localhost/api/overrides');
      
      const response = await POST({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid override type');
    });    it('should handle database insertion errors', async () => {
      // Mock successful soft delete, then insertion failure
      queueMockResponse({ data: null, error: null }); // soft delete succeeds
      queueMockResponse({ data: null, error: { message: 'Database insertion failed' } }); // insert fails

      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          action: 'upsert',
          overrideType: 'symbol',
          contractAddress: '0x123',
          symbol: 'TEST',
          overrideValue: 'test-token',
          chain: 'eth'
        })
      });
      const url = new URL('http://localhost/api/overrides');

      const response = await POST({ request, url } as any);
      const data = await response.json();      expect(response.status).toBe(500);
      expect(data.error).toBe('Database insertion failed');
    });    it('should handle deleteAll action for symbol overrides', async () => {
      // Mock successful bulk delete
      queueMockResponse({ data: null, error: null });

      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          action: 'bulk_delete',
          overrideType: 'symbol',
          walletAddress: '0xwallet123'
        })
      });
      const url = new URL('http://localhost/api/overrides');

      const response = await POST({ request, url } as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe('bulk_delete');
    });it('should handle bulk delete action for address overrides', async () => {
      // Mock successful bulk delete for wallet-specific overrides
      queueMockResponse({
        data: [
          { id: 4, is_active: false, updated_at: new Date().toISOString() }
        ],
        error: null
      });

      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          action: 'bulk_delete',
          walletAddress: '0xwallet123'
        })
      });
      const url = new URL('http://localhost/api/overrides');
      
      const response = await POST({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe('bulk_delete');
    });    it('should handle database errors during bulk delete', async () => {
      // Mock database error during bulk delete
      queueMockResponse({ data: null, error: { message: 'Database error during bulk delete' } });

      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          action: 'bulk_delete',
          overrideType: 'symbol',
          walletAddress: '0xwallet123'
        })
      });
      const url = new URL('http://localhost/api/overrides');

      const response = await POST({ request, url } as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to bulk delete overrides');
    });

    it('should require walletAddress for address override deleteAll', async () => {
      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          action: 'bulk_delete',
          overrideType: 'address'
          // Missing walletAddress
        })
      });
      const url = new URL('http://localhost/api/overrides');

      const response = await POST({ request, url } as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Wallet address required for bulk delete');
    });    it('should create new symbol override successfully', async () => {
      // Mock successful soft delete, then creation
      queueMockResponse({ data: null, error: null }); // soft delete
      queueMockResponse({
        data: {
          id: 5,
          user_id: 'test-user-123',
          contract_address: '0xnewtoken',
          symbol: 'NEWTOKEN',
          chain: 'eth',
          override_type: 'symbol',
          override_value: 'new-coingecko-id',
          wallet_address: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        error: null
      }); // insert

      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          action: 'upsert',
          overrideType: 'symbol',
          contractAddress: '0xnewtoken',
          symbol: 'NEWTOKEN',
          overrideValue: 'new-coingecko-id',
          chain: 'eth'
        })
      });
      const url = new URL('http://localhost/api/overrides');
        const response = await POST({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.symbol).toBe('NEWTOKEN');
      expect(data.data.override_value).toBe('new-coingecko-id');
    });    it('should create new address override successfully', async () => {
      // Mock successful soft delete, then creation
      queueMockResponse({ data: null, error: null }); // soft delete
      queueMockResponse({
        data: {
          id: 6,
          user_id: 'test-user-123',
          contract_address: '0xnewcontract',
          symbol: null,
          chain: 'eth',
          override_type: 'address',
          override_value: '0xoverriddenaddress',
          wallet_address: '0xwallet456',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        error: null
      }); // insert

      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          action: 'upsert',
          overrideType: 'address',
          contractAddress: '0xnewcontract',
          overrideValue: '0xoverriddenaddress',
          walletAddress: '0xwallet456',
          chain: 'eth'
        })
      });
      const url = new URL('http://localhost/api/overrides');
        const response = await POST({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.override_value).toBe('0xoverriddenaddress');
      expect(data.data.wallet_address).toBe('0xwallet456');
    });
  });

  describe('Integration Tests', () => {    it('should handle complete workflow: create, read, delete symbol override', async () => {
      // Create override - need soft delete + insert
      queueMockResponse({ data: null, error: null }); // soft delete for create
      queueMockResponse({
        data: {
          id: 7,
          user_id: 'test-user-123',
          contract_address: '0xworkflow',
          symbol: 'WORKFLOW',
          chain: 'eth',
          override_type: 'symbol',
          override_value: 'workflow-token',
          wallet_address: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        error: null
      }); // insert for create

      // Read overrides
      queueMockResponse({
        data: [
          {
            id: 7,
            user_id: 'test-user-123',
            contract_address: '0xworkflow',
            symbol: 'WORKFLOW',
            chain: 'eth',
            override_type: 'symbol',
            override_value: 'workflow-token',
            wallet_address: null,
            is_active: true
          }
        ],
        error: null
      });

      // Delete override - need find + update
      queueMockResponse({
        data: {
          id: 7,
          user_id: 'test-user-123',
          contract_address: '0xworkflow',
          symbol: 'WORKFLOW',
          chain: 'eth',
          override_type: 'symbol',
          override_value: 'workflow-token',
          wallet_address: null,
          is_active: true
        },
        error: null
      }); // find for delete
      queueMockResponse({ data: null, error: null }); // delete operation

      // Step 1: Create
      const createRequest = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },        body: JSON.stringify({
          action: 'upsert',
          overrideType: 'symbol',
          contractAddress: '0xworkflow',
          symbol: 'WORKFLOW',
          overrideValue: 'workflow-token',
          chain: 'eth'
        })
      });      const createResponse = await POST({ request: createRequest, url: new URL('http://localhost/api/overrides') } as any);
      const createData = await createResponse.json();
      expect(createResponse.status).toBe(200);
      expect(createData.success).toBe(true);

      // Step 2: Read
      const readRequest = new Request('http://localhost/api/overrides', {
        headers: { authorization: 'Bearer valid-token' }
      });

      const readResponse = await GET({ request: readRequest, url: new URL('http://localhost/api/overrides') } as any);
      const readData = await readResponse.json();
      expect(readResponse.status).toBe(200);
      expect(readData.symbolOverrides['WORKFLOW']).toBe('workflow-token');

      // Step 3: Delete
      const deleteRequest = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete',
          overrideType: 'symbol',
          contractAddress: '0xworkflow',
          symbol: 'WORKFLOW'
        })
      });

      const deleteResponse = await POST({ request: deleteRequest, url: new URL('http://localhost/api/overrides') } as any);
      const deleteData = await deleteResponse.json();
      expect(deleteResponse.status).toBe(200);
      expect(deleteData.success).toBe(true);
    });

    it('should properly segregate symbol and address overrides', async () => {
      const walletSpecificOverrides = [
        // Symbol overrides (global)
        {
          id: 1,
          user_id: 'test-user-123',
          contract_address: '0x111',
          symbol: 'TOKEN1',
          chain: 'eth',
          override_type: 'symbol',
          override_value: 'token1-id',
          wallet_address: null,
          is_active: true
        },
        // Address overrides (wallet-specific)
        {
          id: 2,
          user_id: 'test-user-123',
          contract_address: '0x222',
          symbol: null,
          chain: 'eth',
          override_type: 'address',
          override_value: '0x333',
          wallet_address: '0xwallet',
          is_active: true
        }
      ];

      queueMockResponse({
        data: walletSpecificOverrides,
        error: null
      });

      const request = new Request('http://localhost/api/overrides', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const url = new URL('http://localhost/api/overrides?wallet_address=0xwallet');
      
      const response = await GET({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      
      // Symbol overrides should use symbol as key
      expect(data.symbolOverrides).toEqual({
        'TOKEN1': 'token1-id'
      });
      
      // Address overrides should use contract_address as key
      expect(data.addressOverrides).toEqual({
        '0x222': '0x333'
      });
      
      // Should have wallet address
      expect(data.walletAddress).toBe('0xwallet');
    });

    it('should handle mixed data types and legacy records gracefully', async () => {
      const walletOnlyOverrides = [
        // Modern record with symbol field
        {
          id: 1,
          user_id: 'test-user-123',
          contract_address: '0xmodern',
          symbol: 'MODERN',
          chain: 'eth',
          override_type: 'symbol',
          override_value: 'modern-token',
          wallet_address: null,
          is_active: true
        },
        // Legacy record without symbol field (contamination case)
        {
          id: 2,
          user_id: 'test-user-123',
          contract_address: '0x0000000000000000000000000000000000001010',
          symbol: null,
          chain: 'eth',
          override_type: 'symbol',
          override_value: 'ethereum',
          wallet_address: null,
          is_active: true
        }
      ];

      queueMockResponse({
        data: walletOnlyOverrides,
        error: null
      });

      const request = new Request('http://localhost/api/overrides', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const url = new URL('http://localhost/api/overrides');
      
      const response = await GET({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      
      // Should handle both modern and legacy records
      expect(data.symbolOverrides).toEqual({
        'MODERN': 'modern-token',
        // Legacy record uses contract_address as key when symbol is null
        '0x0000000000000000000000000000000000001010': 'ethereum'
      });
      
      expect(data.addressOverrides).toEqual({});
    });
  });
});
