// Data Service - Simplified Supabase-only approach
import { createClient } from '@supabase/supabase-js';

interface CryptoPrice {
  symbol: string;
  price: number;
  timestamp: number;
  source: 'supabase' | 'api';
}

interface PortfolioData {
  userId: string;
  walletAddress: string;
  tokens: Array<{
    symbol: string;
    balance: number;
    value: number;
  }>;
  totalValue: number;
  lastUpdated: number;
}

class DataService {
  private supabase: any;
  
  constructor() {
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.PUBLIC_SUPABASE_URL || '',
      process.env.PUBLIC_SUPABASE_ANON_KEY || ''
    );
  }

  /**
   * Get crypto price from Supabase or API
   */
  async getCryptoPrice(symbol: string): Promise<CryptoPrice | null> {
    try {
      // Check Supabase for recent price data
      const { data: recentPrice } = await this.supabase
        .from('price_history')
        .select('*, assets(symbol)')
        .eq('assets.symbol', symbol.toUpperCase())
        .order('timestamp', { ascending: false })
        .limit(1);

      if (recentPrice && recentPrice.length > 0 && this.isRecentPrice(new Date(recentPrice[0].timestamp).getTime(), 300000)) {
        return {
          symbol: recentPrice[0].assets.symbol,
          price: recentPrice[0].price_usd,
          timestamp: new Date(recentPrice[0].timestamp).getTime(),
          source: 'supabase'
        };
      }

      // Fetch from API if no recent data
      const apiPrice = await this.fetchFromAPI(symbol);
      if (apiPrice) {
        // Store in Supabase
        await this.storeInSupabase(apiPrice);
        return { ...apiPrice, source: 'api' };
      }

      return null;
    } catch (error) {
      console.error('Error getting crypto price:', error);
      return null;
    }
  }

  /**
   * Save portfolio data to Supabase
   */
  async savePortfolioData(data: PortfolioData): Promise<boolean> {
    try {
      await this.syncToSupabase(data);
      return true;
    } catch (error) {
      console.error('Error saving portfolio data:', error);
      return false;
    }
  }

  /**
   * API operations
   */
  private async fetchFromAPI(symbol: string): Promise<CryptoPrice | null> {
    try {
      // Mock API call - replace with actual crypto price API
      return {
        symbol: symbol.toUpperCase(),
        price: Math.random() * 100000,
        timestamp: Date.now(),
        source: 'api'
      };
    } catch (error) {
      console.error('API fetch error:', error);
      return null;
    }
  }

  /**
   * Supabase operations
   */
  private async storeInSupabase(priceData: CryptoPrice): Promise<void> {
    try {
      // Get asset ID
      const { data: asset } = await this.supabase
        .from('assets')
        .select('id')
        .eq('symbol', priceData.symbol)
        .single();

      if (asset) {
        await this.supabase.from('price_history').insert({
          asset_id: asset.id,
          price_usd: priceData.price,
          timestamp: new Date(priceData.timestamp).toISOString()
        });
      }
    } catch (error) {
      console.error('Supabase store error:', error);
    }
  }

  private async syncToSupabase(portfolioData: PortfolioData): Promise<void> {
    try {
      await this.supabase.from('portfolio_snapshots').upsert({
        user_id: portfolioData.userId,
        wallet_address: portfolioData.walletAddress,
        data: portfolioData,
        total_value: portfolioData.totalValue,
        last_updated: new Date(portfolioData.lastUpdated).toISOString()
      });
    } catch (error) {
      console.error('Supabase sync error:', error);
    }
  }

  /**
   * Helper methods
   */
  private isRecentPrice(timestamp: number, maxAgeMs: number): boolean {
    return Date.now() - timestamp < maxAgeMs;
  }
}

export const dataService = new DataService();
export type { CryptoPrice, PortfolioData };
