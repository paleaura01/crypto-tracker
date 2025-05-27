import { supabase } from '../supabaseClient.js';

// Type definitions
interface Portfolio {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    status: 'active' | 'archived' | 'deleted';
    is_default: boolean;
    created_at: string;
    updated_at: string;
    total_value_usd: number;
    total_cost_basis_usd: number;
    settings: any;
}

interface Wallet {
    id: string;
    portfolio_id: string;
    name: string;
    address: string;
    chain: string;
    wallet_type: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    last_synced_at?: string;
    metadata: any;
}

interface Holding {
    id: string;
    portfolio_id: string;
    wallet_id: string;
    asset_id: string;
    quantity: number;
    average_cost_usd: number;
    total_cost_basis_usd: number;
    current_price_usd: number;
    current_value_usd: number;
    unrealized_pnl_usd: number;
    unrealized_pnl_percent: number;
    created_at: string;
    updated_at: string;
    last_price_update?: string;
}

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
    }

    /**
     * Get user profile from Supabase
     */
    async getUserProfile(userId: string) {
        try {
            const { data: supabaseUser } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            return supabaseUser;
        } catch (error) {
            console.error('Error getting user profile:', error);
            throw error;
        }
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
            
            return portfolios || [];
        } catch (error) {
            console.error('Error getting portfolios:', error);
            return [];
        }
    }

    /**
     * Get current crypto prices with mock data
     */
    async getCryptoPrices(symbols: string[]) {
        try {
            const prices: Record<string, any> = {};
            
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
            
            return prices;
        } catch (error) {
            console.error('Error getting crypto prices:', error);
            return {};
        }
    }
    
    /**
     * Store price data in Supabase price history
     */
    private async storePriceHistory(symbol: string, priceData: any) {
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
            });
        } catch (error) {
            console.error('Error storing price history:', error);
        }
    }
    
    /**
     * Create a new portfolio in Supabase
     */
    async createPortfolio(userId: string, portfolioData: any) {
        try {
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
        } catch (error) {
            console.error('Error creating portfolio:', error);
            throw error;
        }
    }
    
    /**
     * Add a wallet to a portfolio in Supabase
     */
    async addWallet(portfolioId: string, walletData: any) {
        try {
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
        } catch (error) {
            console.error('Error adding wallet:', error);
            throw error;
        }
    }
}

export const cryptoDataService = CryptoDataService.getInstance();
