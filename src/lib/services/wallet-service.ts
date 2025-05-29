// Wallet service for blockchain operations and balance fetching
import type { 
  Wallet,
  WalletBalanceResponse,
  BlockchainNetworkInput,
  ApiResponse,
  Transaction
} from '../types/index.js';
import type { TokenBalance } from '../types/portfolio.js';
import { validateAddressForChain, validateWallet, isValidBlockchainNetwork } from '../utils/validation.js';
import { createApiResponse, createErrorResponse, retryAsync, SimpleCache } from '../utils/api-helpers.js';

// Interfaces for normalizing token data
interface EVMTokenData {
  contractAddress?: string;
  symbol?: string;
  name?: string;
  balance?: string;
  decimals?: number;
  price?: number;
  logo?: string;
}

interface SolanaTokenData {
  mint?: string;
  symbol?: string;
  name?: string;
  amount?: string;
  decimals?: number;
  price?: number;
  logo?: string;
}

// Cache for wallet balances (5 minute TTL)
const balanceCache = new SimpleCache<TokenBalance[]>(5 * 60 * 1000);

export class WalletService {
  private static instance: WalletService;

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  private constructor() {}
  /**
   * Get wallet balance from blockchain
   */  async getWalletBalance(
    address: string,
    chain: BlockchainNetworkInput,
    forceRefresh: boolean = false
  ): Promise<WalletBalanceResponse> {
    try {      // Handle chain validation properly
      let chainForValidation: string;
      if (typeof chain === 'string') {
        chainForValidation = chain;
      } else if (chain && typeof chain === 'object') {
        const chainObj = chain as { id?: string; name?: string };
        chainForValidation = chainObj.id || chainObj.name || 'unknown';
      } else {
        chainForValidation = 'unknown';
      }
      
      // Validate address format - only if chain is a valid BlockchainNetwork
      if (isValidBlockchainNetwork(chainForValidation)) {
        if (!validateAddressForChain(address, chainForValidation)) {
          return createErrorResponse('Invalid address format for the specified chain');
        }
      } else {
        return createErrorResponse('Unsupported blockchain network');
      }

      const cacheKey = `${chain}:${address}`;
      
      // Check cache first unless force refresh
      if (!forceRefresh) {
        const cachedBalance = balanceCache.get(cacheKey);
        if (cachedBalance) {
          const totalValue = cachedBalance.reduce((sum: number, token: TokenBalance) => sum + token.value_usd, 0);
          return createApiResponse({
            address,
            chain: typeof chain === 'string' ? chain : (chain.id || chain.name || 'unknown'),
            balances: cachedBalance,
            total_value_usd: totalValue,
            last_updated: new Date().toISOString()
          });
        }
      }

      // Fetch balance from appropriate provider
      const balances = await this.fetchBalanceFromProvider(address, chain);
      
      // Cache the result
      balanceCache.set(cacheKey, balances);
      
      const totalValue = balances.reduce((sum, token) => sum + token.value_usd, 0);
      
      return createApiResponse({
        address,
        chain: typeof chain === 'string' ? chain : (chain.id || chain.name || 'unknown'),
        balances,
        total_value_usd: totalValue,
        last_updated: new Date().toISOString()
      });
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch wallet balance'
      );
    }
  }

  /**
   * Fetch balance from appropriate blockchain provider
   */  private async fetchBalanceFromProvider(
    address: string,
    chain: BlockchainNetworkInput
  ): Promise<TokenBalance[]> {
    const chainId = typeof chain === 'string' ? chain : chain.id || chain.name;
    switch (chainId) {
      case 'ethereum':
      case 'polygon':
      case 'bsc':
      case 'arbitrum':
      case 'optimism':
      case 'avalanche':
        return this.fetchEVMBalance(address, chain);
      
      case 'solana':
        return this.fetchSolanaBalance(address);
      
      case 'bitcoin':
        return this.fetchBitcoinBalance(address);
      
      case 'cosmos':
        return this.fetchCosmosBalance(address);
      
      default:
        throw new Error(`Unsupported chain: ${chainId}`);
    }
  }

  /**
   * Fetch EVM chain balance (Ethereum, Polygon, BSC, etc.)
   */  private async fetchEVMBalance(
    address: string,
    chain: BlockchainNetworkInput
  ): Promise<TokenBalance[]> {
    // This would integrate with providers like Alchemy, Moralis, or Covalent
    // For now, we'll return a mock implementation
    
    return retryAsync(async () => {
      // Mock API call - replace with actual provider integration
      const response = await fetch(`/api/wallet/wallet-address/alchemy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, chain })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.normalizeEVMTokens(data.tokens || []);
    }, { maxRetries: 3, delay: 1000 });
  }

  /**
   * Fetch Solana balance
   */
  private async fetchSolanaBalance(address: string): Promise<TokenBalance[]> {
    return retryAsync(async () => {
      // Mock implementation - would integrate with Solana RPC or providers
      const response = await fetch(`/api/wallet/solana/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.normalizeSolanaTokens(data.tokens || []);
    }, { maxRetries: 3, delay: 1000 });
  }

  /**
   * Fetch Bitcoin balance
   */
  private async fetchBitcoinBalance(address: string): Promise<TokenBalance[]> {
    return retryAsync(async () => {
      // Mock implementation - would integrate with Bitcoin APIs
      const response = await fetch(`/api/wallet/bitcoin/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return [{
        token_address: '',
        symbol: 'BTC',
        name: 'Bitcoin',
        balance: data.balance || '0',
        decimals: 8,
        price_usd: data.price_usd || 0,
        value_usd: (parseFloat(data.balance || '0') * (data.price_usd || 0)),
        logo_url: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
      }];
    }, { maxRetries: 3, delay: 1000 });
  }

  /**
   * Fetch Cosmos balance
   */
  private async fetchCosmosBalance(_address: string): Promise<TokenBalance[]> {
    // Mock implementation for Cosmos
    return [];
  }

  /**
   * Normalize EVM token data to our standard format
   */
  private normalizeEVMTokens(tokens: EVMTokenData[]): TokenBalance[] {
    return tokens.map(token => ({
      token_address: token.contractAddress || '',
      symbol: token.symbol || 'UNKNOWN',
      name: token.name || 'Unknown Token',
      balance: token.balance || '0',
      decimals: token.decimals || 18,      price_usd: token.price || 0,
      value_usd: parseFloat(token.balance || '0') * (token.price || 0),
      logo_url: token.logo || ''
    }));
  }

  /**
   * Normalize Solana token data to our standard format
   */
  private normalizeSolanaTokens(tokens: SolanaTokenData[]): TokenBalance[] {
    return tokens.map(token => ({
      token_address: token.mint || '',
      symbol: token.symbol || 'UNKNOWN',
      name: token.name || 'Unknown Token',
      balance: token.amount || '0',
      decimals: token.decimals || 9,      price_usd: token.price || 0,
      value_usd: parseFloat(token.amount || '0') * (token.price || 0),
      logo_url: token.logo || ''
    }));
  }

  /**
   * Get wallet transactions
   */  async getWalletTransactions(
    address: string,
    chain: BlockchainNetworkInput,
    options: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ApiResponse<Transaction[]>> {
    try {      // Handle chain validation properly
      let chainForValidation: string;
      if (typeof chain === 'string') {
        chainForValidation = chain;
      } else if (chain && typeof chain === 'object') {
        const chainObj = chain as { id?: string; name?: string };
        chainForValidation = chainObj.id || chainObj.name || 'unknown';
      } else {
        chainForValidation = 'unknown';
      }
      
      // Validate address format - only if chain is a valid BlockchainNetwork
      if (isValidBlockchainNetwork(chainForValidation)) {
        if (!validateAddressForChain(address, chainForValidation)) {
          return createErrorResponse('Invalid address format for the specified chain');
        }
      } else {
        return createErrorResponse('Unsupported blockchain network');
      }

      const transactions = await this.fetchTransactionsFromProvider(address, chain, options);
      return createApiResponse(transactions);
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch transactions'
      );
    }
  }  /**
   * Fetch transactions from blockchain provider
   */  private async fetchTransactionsFromProvider(
    _address: string,
    _chain: BlockchainNetworkInput,
    _options: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<Transaction[]> {
    // Mock implementation - would integrate with actual providers
    return [];
  }

  /**
   * Validate wallet connectivity
   */
  async validateWalletConnection(wallet: Wallet): Promise<ApiResponse<boolean>> {
    try {
      if (!validateWallet(wallet)) {
        return createErrorResponse('Invalid wallet data');
      }      // Handle chain validation properly
      let chainForValidation: string;
      if (typeof wallet.chain === 'string') {
        chainForValidation = wallet.chain;      } else if (wallet.chain && typeof wallet.chain === 'object') {
        const chainObj = wallet.chain as { id?: string; name?: string };
        chainForValidation = chainObj.id || chainObj.name || 'unknown';
      } else {
        return createErrorResponse('Invalid chain data');
      }
        
      // Validate address format - only if chain is a valid BlockchainNetwork
      if (isValidBlockchainNetwork(chainForValidation)) {
        if (!validateAddressForChain(wallet.address, chainForValidation)) {
          return createErrorResponse('Invalid address format for chain');
        }
      } else {
        return createErrorResponse('Unsupported blockchain network');
      }

      // Try to fetch a simple balance to test connectivity
      const balanceResult = await this.getWalletBalance(wallet.address, wallet.chain);
      
      return createApiResponse(balanceResult.success);
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to validate wallet connection'
      );
    }
  }
  /**
   * Clear balance cache for a specific wallet
   */  clearCache(address: string, chain: BlockchainNetworkInput): void {
    const chainObj = chain as { id?: string; name?: string };
    const chainKey = typeof chain === 'string' ? chain : (chainObj.id || chainObj.name || 'unknown');
    const cacheKey = `${chainKey}:${address}`;
    balanceCache.delete(cacheKey);
  }

  /**
   * Clear all cached balances
   */
  clearAllCache(): void {
    balanceCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxAge: number } {
    return {
      size: balanceCache.size(),
      maxAge: 5 * 60 * 1000 // 5 minutes in milliseconds
    };
  }
}

export const walletService = WalletService.getInstance();
