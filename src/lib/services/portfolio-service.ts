// Enhanced portfolio service with proper TypeScript integration
import type { 
  Portfolio, 
  Wallet, 
  CreatePortfolioRequest,
  CreateWalletRequest,
  ApiResponse,
  PortfolioAnalytics
} from '../types/index.js';
import { supabase } from '../supabaseClient.js';
import { validatePortfolio, validateWallet } from '../utils/validation.js';
import { createApiResponse, createErrorResponse } from '../utils/api-helpers.js';

export class PortfolioService {
  private static instance: PortfolioService;

  static getInstance(): PortfolioService {
    if (!PortfolioService.instance) {
      PortfolioService.instance = new PortfolioService();
    }
    return PortfolioService.instance;
  }

  private constructor() {}

  /**
   * Get all portfolios for a user
   */
  async getPortfolios(userId: string): Promise<ApiResponse<Portfolio[]>> {
    try {
      const { data: portfolios, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        return createErrorResponse(error.message);
      }

      // Validate each portfolio
      const validPortfolios = portfolios?.filter(validatePortfolio) || [];
      
      return createApiResponse(validPortfolios);
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch portfolios'
      );
    }
  }

  /**
   * Get a specific portfolio by ID
   */
  async getPortfolio(portfolioId: string, userId: string): Promise<ApiResponse<Portfolio>> {
    try {
      const { data: portfolio, error } = await supabase
        .from('portfolios')
        .select(`
          *,
          wallets(*),
          holdings(*, assets(*))
        `)
        .eq('id', portfolioId)
        .eq('user_id', userId)
        .single();

      if (error) {
        return createErrorResponse(error.message);
      }

      if (!validatePortfolio(portfolio)) {
        return createErrorResponse('Invalid portfolio data');
      }

      return createApiResponse(portfolio);
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch portfolio'
      );
    }
  }

  /**
   * Create a new portfolio
   */
  async createPortfolio(
    userId: string, 
    request: CreatePortfolioRequest
  ): Promise<ApiResponse<Portfolio>> {
    try {
      const portfolioData = {
        user_id: userId,
        name: request.name,
        description: request.description,
        is_default: request.is_default || false,
        status: 'active' as const,
        total_value_usd: 0,
        total_cost_basis_usd: 0,
        settings: {
          currency: 'USD',
          privacy_mode: false,
          auto_sync: true
        }
      };

      const { data: portfolio, error } = await supabase
        .from('portfolios')
        .insert(portfolioData)
        .select()
        .single();

      if (error) {
        return createErrorResponse(error.message);
      }

      if (!validatePortfolio(portfolio)) {
        return createErrorResponse('Failed to create valid portfolio');
      }

      return createApiResponse(portfolio);
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to create portfolio'
      );
    }
  }

  /**
   * Update portfolio
   */
  async updatePortfolio(
    portfolioId: string,
    userId: string,
    updates: Partial<Portfolio>
  ): Promise<ApiResponse<Portfolio>> {
    try {
      const { data: portfolio, error } = await supabase
        .from('portfolios')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', portfolioId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return createErrorResponse(error.message);
      }

      if (!validatePortfolio(portfolio)) {
        return createErrorResponse('Invalid portfolio data after update');
      }

      return createApiResponse(portfolio);
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to update portfolio'
      );
    }
  }

  /**
   * Delete portfolio (soft delete)
   */
  async deletePortfolio(portfolioId: string, userId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('portfolios')
        .update({ 
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', portfolioId)
        .eq('user_id', userId);

      if (error) {
        return createErrorResponse(error.message);
      }

      return createApiResponse(true);
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to delete portfolio'
      );
    }
  }

  /**
   * Get portfolio analytics
   */
  async getPortfolioAnalytics(
    portfolioId: string, 
    userId: string
  ): Promise<ApiResponse<PortfolioAnalytics>> {
    try {
      // Get portfolio with holdings
      const { data: portfolio, error: portfolioError } = await supabase
        .from('portfolios')
        .select(`
          *,
          holdings(*, assets(*))
        `)
        .eq('id', portfolioId)
        .eq('user_id', userId)
        .single();

      if (portfolioError) {
        return createErrorResponse(portfolioError.message);
      }

      const holdings = portfolio.holdings || [];      // Calculate analytics
      interface HoldingData {
        current_value_usd?: number;
        total_cost_basis_usd?: number;
        unrealized_pnl_percent?: number;
        asset?: { symbol?: string; name?: string; chain?: string };
        symbol?: string;
        name?: string;
      }
      
      const totalValue = holdings.reduce((sum: number, holding: HoldingData) => 
        sum + (holding.current_value_usd || 0), 0
      );
      
      const totalCostBasis = holdings.reduce((sum: number, holding: HoldingData) => 
        sum + (holding.total_cost_basis_usd || 0), 0
      );
      
      const totalPnL = totalValue - totalCostBasis;
      const totalPnLPercent = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

      // Asset allocation
      const allocation = holdings.map((holding: HoldingData) => ({
        symbol: holding.asset?.symbol || holding.symbol,
        name: holding.asset?.name || holding.name,
        value_usd: holding.current_value_usd || 0,
        percentage: totalValue > 0 ? ((holding.current_value_usd || 0) / totalValue) * 100 : 0,
        chain: holding.asset?.chain || 'unknown'
      }));

      // Performance metrics (simplified - would need historical data for full implementation)
      const performance = {
        daily_change: 0, // Would calculate from historical data
        weekly_change: 0,
        monthly_change: 0,
        yearly_change: 0,
        all_time_high: totalValue,
        all_time_low: totalValue
      };

      // Top and worst performers
      const sortedHoldings = holdings.sort((a: HoldingData, b: HoldingData) => 
        (b.unrealized_pnl_percent || 0) - (a.unrealized_pnl_percent || 0)
      );
      
      const analytics: PortfolioAnalytics = {
        total_value_usd: totalValue,
        total_cost_basis_usd: totalCostBasis,
        total_pnl_usd: totalPnL,
        total_pnl_percent: totalPnLPercent,
        allocation,
        performance,
        top_performers: sortedHoldings.slice(0, 5),
        worst_performers: sortedHoldings.slice(-5).reverse()
      };

      return createApiResponse(analytics);
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to calculate analytics'
      );
    }
  }

  /**
   * Add wallet to portfolio
   */
  async addWallet(
    portfolioId: string,
    userId: string,
    walletRequest: CreateWalletRequest
  ): Promise<ApiResponse<Wallet>> {
    try {
      // Verify portfolio ownership
      const { data: portfolio } = await supabase
        .from('portfolios')
        .select('id')
        .eq('id', portfolioId)
        .eq('user_id', userId)
        .single();

      if (!portfolio) {
        return createErrorResponse('Portfolio not found or access denied');
      }

      const walletData = {
        ...walletRequest,
        portfolio_id: portfolioId,
        is_active: true,
        metadata: {}
      };

      const { data: wallet, error } = await supabase
        .from('wallets')
        .insert(walletData)
        .select()
        .single();

      if (error) {
        return createErrorResponse(error.message);
      }

      if (!validateWallet(wallet)) {
        return createErrorResponse('Failed to create valid wallet');
      }

      return createApiResponse(wallet);
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to add wallet'
      );
    }
  }

  /**
   * Get wallets for a portfolio
   */
  async getWallets(portfolioId: string, userId: string): Promise<ApiResponse<Wallet[]>> {
    try {
      // Verify portfolio ownership
      const { data: portfolio } = await supabase
        .from('portfolios')
        .select('id')
        .eq('id', portfolioId)
        .eq('user_id', userId)
        .single();

      if (!portfolio) {
        return createErrorResponse('Portfolio not found or access denied');
      }

      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        return createErrorResponse(error.message);
      }

      const validWallets = wallets?.filter(validateWallet) || [];
      return createApiResponse(validWallets);
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch wallets'
      );
    }
  }
}

export const portfolioService = PortfolioService.getInstance();
