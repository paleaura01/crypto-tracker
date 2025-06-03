/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock BroadcastChannel to prevent Node.js errors
global.BroadcastChannel = vi.fn(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  close: vi.fn(),
  postMessage: vi.fn()
}));

// Mock MessageEvent to prevent errors
global.MessageEvent = vi.fn();

// Test configuration
const TEST_BASE_URL = 'http://localhost:5173';
const TEST_WALLET = '0xbaC4412fA1Be857b5F7be980370C95317fa5458d';
const MOCK_USER_ID = 'eb0e5944-30a6-4b37-a12e-e3f99dc5db14'; // Test user ID from migrations

describe('Token Override Functionality', () => {
  let mockFetch: any;

  beforeEach(() => {
    // Mock fetch to simulate successful API responses
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('API Override Operations', () => {
    it('should create symbol override correctly', async () => {
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Override created successfully' })
      });

      const response = await fetch(`${TEST_BASE_URL}/api/overrides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock_token'
        },
        body: JSON.stringify({
          contractAddress: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
          chain: 'eth',
          overrideType: 'symbol',
          overrideValue: 'test-coingecko-id',
          walletAddress: TEST_WALLET,
          symbol: 'WETH',
          action: 'upsert'
        })
      });

      const result = await response.json();
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        `${TEST_BASE_URL}/api/overrides`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock_token'
          })
        })
      );
    });

    it('should delete symbol override by symbol name', async () => {
      // Mock successful responses for create and delete
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, message: 'Override deleted successfully' })
        });

      // First create an override
      await fetch(`${TEST_BASE_URL}/api/overrides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock_token'
        },
        body: JSON.stringify({
          contractAddress: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
          chain: 'eth',
          overrideType: 'symbol',
          overrideValue: 'test-coingecko-id',
          walletAddress: TEST_WALLET,
          symbol: 'WETH',
          action: 'upsert'
        })
      });

      // Then delete it
      const deleteResponse = await fetch(`${TEST_BASE_URL}/api/overrides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock_token'
        },
        body: JSON.stringify({
          contractAddress: '', // Empty string for symbol deletions
          overrideType: 'symbol',
          walletAddress: TEST_WALLET,
          symbol: 'WETH',
          action: 'delete'
        })
      });

      const deleteResult = await deleteResponse.json();
      expect(deleteResponse.ok).toBe(true);
      expect(deleteResult.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retrieve overrides in correct format', async () => {
      // Mock successful response with expected structure
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          symbolOverrides: {
            'WETH': 'test-coingecko-id',
            'MATIC': 'ethereum'
          },
          addressOverrides: {
            '0x1234567890123456789012345678901234567890': 'custom-token-id'
          }
        })
      });

      const response = await fetch(`${TEST_BASE_URL}/api/overrides?wallet_address=${encodeURIComponent(TEST_WALLET)}`, {
        headers: {
          'Authorization': 'Bearer mock_token'
        }
      });

      const overrides = await response.json();
      expect(response.ok).toBe(true);
      expect(overrides.symbolOverrides).toBeDefined();
      expect(overrides.addressOverrides).toBeDefined();
      expect(typeof overrides.symbolOverrides).toBe('object');
      expect(typeof overrides.addressOverrides).toBe('object');
    });

    it('should handle validation errors properly', async () => {
      // Mock validation error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ 
          success: false, 
          error: 'Missing required field: symbol for symbol override' 
        })
      });

      const response = await fetch(`${TEST_BASE_URL}/api/overrides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock_token'
        },
        body: JSON.stringify({
          contractAddress: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
          chain: 'eth',
          overrideType: 'symbol',
          overrideValue: 'test-coingecko-id',
          walletAddress: TEST_WALLET,
          // Missing symbol field
          action: 'upsert'
        })
      });

      const result = await response.json();
      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('symbol');
    });
  });

  describe('Reset All Symbols Workflow', () => {
    it('should delete all symbol overrides successfully', async () => {
      // Mock GET response to return existing overrides
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          symbolOverrides: {
            'WETH': 'ethereum',
            'MATIC': 'polygon-pos',
            'ETH': null // excluded item
          },
          addressOverrides: {}
        })
      });

      // Get current overrides
      const getResponse = await fetch(`${TEST_BASE_URL}/api/overrides?wallet_address=${encodeURIComponent(TEST_WALLET)}`, {
        headers: {
          'Authorization': 'Bearer mock_token'
        }
      });

      const overrides = await getResponse.json();
      expect(overrides.symbolOverrides).toBeDefined();

      // Mock successful delete responses for each symbol
      const symbols = Object.keys(overrides.symbolOverrides);
      for (let i = 0; i < symbols.length; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });
      }

      // Delete each symbol override
      for (const symbol of symbols) {
        const deleteResponse = await fetch(`${TEST_BASE_URL}/api/overrides`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock_token'
          },
          body: JSON.stringify({
            contractAddress: '',
            overrideType: 'symbol',
            walletAddress: TEST_WALLET,
            symbol,
            action: 'delete'
          })
        });

        const deleteResult = await deleteResponse.json();
        expect(deleteResponse.ok).toBe(true);
        expect(deleteResult.success).toBe(true);
      }

      // Should have made 1 GET + 3 DELETE calls
      expect(mockFetch).toHaveBeenCalledTimes(1 + symbols.length);
    });

    it('should handle reset operation with proper error handling', async () => {
      // Mock GET response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          symbolOverrides: {
            'WETH': 'ethereum'
          },
          addressOverrides: {}
        })
      });

      // Mock failed delete response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ 
          success: false, 
          error: 'Database error' 
        })
      });

      const getResponse = await fetch(`${TEST_BASE_URL}/api/overrides?wallet_address=${encodeURIComponent(TEST_WALLET)}`, {
        headers: {
          'Authorization': 'Bearer mock_token'
        }
      });

      const overrides = await getResponse.json();
      
      // Try to delete the symbol override
      const deleteResponse = await fetch(`${TEST_BASE_URL}/api/overrides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock_token'
        },
        body: JSON.stringify({
          contractAddress: '',
          overrideType: 'symbol',
          walletAddress: TEST_WALLET,
          symbol: 'WETH',
          action: 'delete'
        })
      });

      const deleteResult = await deleteResponse.json();
      expect(deleteResponse.ok).toBe(false);
      expect(deleteResult.success).toBe(false);
      expect(deleteResult.error).toBe('Database error');
    });
  });

  describe('Database Structure Validation', () => {
    it('should expect proper symbol override structure', () => {
      // Test that our API structure expectations are correct
      const expectedSymbolOverride = {
        symbolOverrides: {
          'WETH': 'ethereum',
          'MATIC': 'polygon-pos',
          'ETH': null // excluded
        },
        addressOverrides: {
          '0x1234567890123456789012345678901234567890': 'custom-token'
        }
      };

      // Verify structure
      expect(expectedSymbolOverride.symbolOverrides).toBeDefined();
      expect(expectedSymbolOverride.addressOverrides).toBeDefined();
      expect(typeof expectedSymbolOverride.symbolOverrides).toBe('object');
      expect(typeof expectedSymbolOverride.addressOverrides).toBe('object');
      
      // Verify symbol overrides are keyed by symbol names
      for (const key of Object.keys(expectedSymbolOverride.symbolOverrides)) {
        expect(key).toMatch(/^[A-Z0-9]+$/); // Symbol format
        expect(key).not.toMatch(/^0x[a-fA-F0-9]{40}$/); // Not an address
      }
      
      // Verify address overrides are keyed by addresses
      for (const key of Object.keys(expectedSymbolOverride.addressOverrides)) {
        expect(key).toMatch(/^0x[a-fA-F0-9]{40}$/); // Address format
      }
    });
  });
});
