import { supabase } from '../supabaseClient.js';

/**
 * Simplified data service for Supabase-only architecture
 */
export class CryptoDataService {
    private static instance: CryptoDataService;
    
    static getInstance(): CryptoDataService {
        if (!CryptoDataService.instance) {
            CryptoDataService.instance = new CryptoDataService();
        }
        return CryptoDataService.instance;
    }
    
    private constructor() {
        // Simple constructor for Supabase-only approach
    }    /**
     * Get user profile from Supabase
     */
    async getUserProfile(userId: string) {
        const { data: supabaseUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        
        return supabaseUser;
    }

    /**
     * Get portfolios for a user from Supabase
     */
    async getUserPortfolios(userId: string) {
        try {
            const { data: portfolios } = await supabase
                .from('portfolios')
                .select(`
                    *,
                    wallets(*),
                    holdings(*, assets(*))
                `)
                .eq('user_id', userId)
                .eq('status', 'active');
            
            return portfolios || [];        } catch {
            return [];
        }
    }

    /**
     * Get current crypto prices with mock data
     */
    async getCryptoPrices(symbols: string[]) {
        try {
            const prices: Record<string, Record<string, unknown>> = {};
            
            // Simulate price fetching - replace with actual API call
            for (const symbol of symbols) {
                const mockPrice = {
                    symbol,
                    price_usd: Math.random() * 100000,
                    price_change_24h: (Math.random() - 0.5) * 20,
                    last_updated: new Date().toISOString()
                };
                
                prices[symbol] = mockPrice;
                
                // Store in price_history
                await this.storePriceHistory(symbol, mockPrice);
            }
            
            return prices;        } catch {
            return {};
        }
    }
    
    /**
     * Store price data in Supabase price history
     */
    private async storePriceHistory(symbol: string, priceData: Record<string, unknown>) {
        try {
            // Get asset ID
            const { data: asset } = await supabase
                .from('assets')
                .select('id')
                .eq('symbol', symbol.toUpperCase())
                .single();
                
            if (!asset) return;
            
            // Insert into Supabase
            await supabase.from('price_history').insert({
                asset_id: asset.id,
                price_usd: priceData.price_usd,
                price_change_24h_percent: priceData.price_change_24h,
                timestamp: new Date().toISOString()
            });        } catch {
            // Silently fail for price history storage
        }
    }
      /**
     * Create a new portfolio in Supabase
     */
    async createPortfolio(userId: string, portfolioData: Record<string, unknown>) {
        const { data: portfolio, error } = await supabase
            .from('portfolios')
            .insert({
                user_id: userId,
                ...portfolioData
            })
            .select()
            .single();
            
        if (error) throw error;
        
        return portfolio;
    }
      /**
     * Add a wallet to a portfolio in Supabase
     */
    async addWallet(portfolioId: string, walletData: Record<string, unknown>) {
        const { data: wallet, error } = await supabase
            .from('wallets')
            .insert({
                portfolio_id: portfolioId,
                ...walletData
            })
            .select()
            .single();
            
        if (error) throw error;
          return wallet;
    }
}

export const cryptoDataService = CryptoDataService.getInstance();
