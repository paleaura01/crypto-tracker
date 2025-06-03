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

describe('Token Override API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResponses.length = 0; // Clear the queue
    
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
  const queueMockResponse = (response: any) => {
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
      mockQuery.mockResolvedValue({
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
      mockQuery.mockResolvedValue({
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
      mockQuery.mockResolvedValue({
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
  });

  describe('POST /api/overrides', () => {
    it('should create a new symbol override correctly', async () => {
      const newOverride = {
        id: 5,
        user_id: 'test-user-123',
        contract_address: null,
        symbol: 'BTC',
        chain: 'eth',
        override_type: 'symbol',
        override_value: 'bitcoin',
        wallet_address: null,
        is_active: true
      };

      mockQuery.mockResolvedValueOnce({ data: null, error: null }); // soft delete
      mockQuery.mockResolvedValueOnce({ data: newOverride, error: null }); // insert

      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          symbol: 'BTC',
          overrideType: 'symbol',
          overrideValue: 'bitcoin',
          action: 'upsert'
        })
      });
      
      const response = await POST({ request } as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe('upsert');
      expect(data.data.symbol).toBe('BTC');
    });

    it('should validate required fields for symbol overrides', async () => {
      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          overrideType: 'symbol',
          overrideValue: 'bitcoin',
          action: 'upsert'
          // Missing both symbol and contractAddress
        })
      });
      
      const response = await POST({ request } as any);
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
        },
        body: JSON.stringify({
          overrideType: 'address',
          overrideValue: '0x1234567890abcdef',
          action: 'upsert'
          // Missing contractAddress
        })
      });
      
      const response = await POST({ request } as any);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Contract address required for address overrides');
    });

    it('should handle delete action correctly', async () => {
      const existingOverride = mockOverrides[0];
      mockQuery.mockResolvedValueOnce({ data: existingOverride, error: null }); // find
      mockQuery.mockResolvedValueOnce({ data: null, error: null }); // delete

      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          symbol: 'MATIC',
          overrideType: 'symbol',
          action: 'delete'
        })
      });
      
      const response = await POST({ request } as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe('delete');
    });

    it('should handle bulk delete action correctly', async () => {
      mockQuery.mockResolvedValue({ data: null, error: null });

      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: '0xwallet123',
          action: 'bulk_delete'
        })
      });
      
      const response = await POST({ request } as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe('bulk_delete');
      expect(data.message).toContain('All overrides removed for wallet 0xwallet123');
    });

    it('should require wallet address for bulk delete', async () => {
      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          action: 'bulk_delete'
          // Missing walletAddress
        })
      });
      
      const response = await POST({ request } as any);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Wallet address required for bulk delete');
    });

    it('should validate action type', async () => {
      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          symbol: 'BTC',
          overrideType: 'symbol',
          overrideValue: 'bitcoin',
          action: 'invalid_action'
        })
      });
      
      const response = await POST({ request } as any);
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
        },
        body: JSON.stringify({
          symbol: 'BTC',
          overrideType: 'invalid_type',
          overrideValue: 'bitcoin',
          action: 'upsert'
        })
      });
      
      const response = await POST({ request } as any);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid override type');
    });

    it('should handle database insertion errors', async () => {
      mockQuery.mockResolvedValueOnce({ data: null, error: null }); // soft delete
      mockQuery.mockResolvedValueOnce({ 
        data: null, 
        error: new Error('Unique constraint violation') 
      }); // insert

      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          symbol: 'BTC',
          overrideType: 'symbol',
          overrideValue: 'bitcoin',
          action: 'upsert'
        })
      });
      
      const response = await POST({ request } as any);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Unique constraint violation');
    });
  });

  describe('Data Segregation', () => {
    it('should properly segregate symbol and address overrides', async () => {
      const mixedOverrides = [
        {
          id: 1,
          user_id: 'test-user-123',
          contract_address: '0x1010',
          symbol: 'MATIC',
          override_type: 'symbol',
          override_value: 'ethereum',
          wallet_address: null,
          is_active: true
        },
        {
          id: 2,
          user_id: 'test-user-123',
          contract_address: '0x2020',
          symbol: null,
          override_type: 'address',
          override_value: '0x3030',
          wallet_address: null,
          is_active: true
        }
      ];

      mockQuery.mockResolvedValue({
        data: mixedOverrides,
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
        'MATIC': 'ethereum'
      });
      expect(data.addressOverrides).toEqual({
        '0x2020': '0x3030'
      });
    });

    it('should use symbol as key for symbol overrides, falling back to contract_address', async () => {
      const overridesWithoutSymbol = [
        {
          id: 1,
          user_id: 'test-user-123',
          contract_address: '0x1010',
          symbol: null, // No symbol field
          override_type: 'symbol',
          override_value: 'ethereum',
          wallet_address: null,
          is_active: true
        }
      ];

      mockQuery.mockResolvedValue({
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
      expect(data.symbolOverrides).toEqual({
        '0x1010': 'ethereum'  // Falls back to contract_address as key
      });
    });
  });

  describe('Reset All Symbols Functionality', () => {
    it('should reset all symbol overrides for a wallet', async () => {
      // Mock the bulk delete operation
      mockQuery.mockResolvedValue({ data: null, error: null });

      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: '0xwallet123',
          action: 'bulk_delete'
        })
      });
      
      const response = await POST({ request } as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe('bulk_delete');

      // Verify the correct Supabase calls were made
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('token_overrides');
      expect(mockQuery.update).toHaveBeenCalledWith({
        is_active: false,
        action: 'delete',
        updated_at: expect.any(String)
      });
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockQuery.eq).toHaveBeenCalledWith('wallet_address', '0xwallet123');
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should handle errors during bulk delete gracefully', async () => {
      mockQuery.mockResolvedValue({ 
        data: null, 
        error: new Error('Database error during bulk delete') 
      });

      const request = new Request('http://localhost/api/overrides', {
        method: 'POST',
        headers: { 
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: '0xwallet123',
          action: 'bulk_delete'
        })
      });
      
      const response = await POST({ request } as any);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to bulk delete overrides');
    });
  });

  describe('Wallet-Specific Operations', () => {
    it('should filter overrides by wallet address correctly', async () => {
      const walletSpecificOverrides = mockOverrides.filter(o => 
        o.wallet_address === '0xwallet123' || o.wallet_address === null
      );

      mockQuery.mockResolvedValue({
        data: walletSpecificOverrides,
        error: null
      });

      const request = new Request('http://localhost/api/overrides', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const url = new URL('http://localhost/api/overrides?wallet_address=0xwallet123&include_global=true');
      
      const response = await GET({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.walletAddress).toBe('0xwallet123');
      
      // Should include both wallet-specific and global overrides
      expect(data.walletSpecific).toEqual({
        '0xabcdef1234567890': '0x1234567890abcdef'
      });
      expect(data.global).toEqual({
        'MATIC': 'ethereum',
        'ETH': null,
        'WETH': '0x678-landwolf-1933'
      });
    });

    it('should exclude global overrides when include_global=false', async () => {
      const walletOnlyOverrides = mockOverrides.filter(o => 
        o.wallet_address === '0xwallet123'
      );

      mockQuery.mockResolvedValue({
        data: walletOnlyOverrides,
        error: null
      });

      const request = new Request('http://localhost/api/overrides', {
        headers: { authorization: 'Bearer valid-token' }
      });
      const url = new URL('http://localhost/api/overrides?wallet_address=0xwallet123&include_global=false');
        const response = await GET({ request, url } as any);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.walletAddress).toBe('0xwallet123');
      
      // Should only include wallet-specific overrides
      expect(data.addressOverrides).toEqual({
        '0xabcdef1234567890': '0x1234567890abcdef'
      });
      expect(data.symbolOverrides).toEqual({});
    });
  });
});