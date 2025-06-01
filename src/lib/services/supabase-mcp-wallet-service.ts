/**
 * Supabase MCP-based wallet service
 * Uses f1e_execute_sql MCP function for direct database access
 */

export interface WalletData {
    id: string;
    label: string;
    address: string;
    expanded?: boolean;
    symbolOverrides?: Record<string, string>;
    addressOverrides?: Record<string, string>;
}

export interface WalletsConfig {
    wallets: WalletData[];
}

export interface ServiceResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

class SupabaseMCPWalletService {
    private static instance: SupabaseMCPWalletService;

    static getInstance(): SupabaseMCPWalletService {
        if (!SupabaseMCPWalletService.instance) {
            SupabaseMCPWalletService.instance = new SupabaseMCPWalletService();
        }
        return SupabaseMCPWalletService.instance;
    }    /**
     * Save a wallet using Supabase MCP
     */    async saveWallet(wallet: WalletData): Promise<ServiceResponse<boolean>> {
        try {
            // Call the new MCP API endpoint that uses f1e_execute_sql tools
            const response = await fetch('/api/mcp/supabase-query-mcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'save_wallet',
                    wallet: wallet
                })
            });

            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Save operation failed');
            }

            return { success: true, data: true };

        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }/**
     * Delete a wallet using Supabase MCP
     */    async deleteWallet(walletId: string, address: string): Promise<ServiceResponse<boolean>> {
        try {
            const response = await fetch('/api/mcp/supabase-query-mcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'delete_wallet',
                    walletId: walletId,
                    address: address
                })
            });

            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Delete operation failed');
            }

            return { success: true, data: true };

        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }/**
     * Load all wallets using Supabase MCP
     */    async loadWallets(): Promise<ServiceResponse<WalletData[]>> {
        try {
            const response = await fetch('/api/mcp/supabase-query-mcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'load_wallets'
                })
            });

            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Load operation failed');
            }

            return { success: true, data: result.wallets || [] };

        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error', data: [] };
        }
    }/**
     * Test Supabase MCP connection
     */    async testConnection(): Promise<boolean> {
        try {
            const response = await fetch('/api/mcp/supabase-query-mcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'test_connection'
                })
            });

            const result = await response.json();
            const isConnected = response.ok && result.success;
            
            return isConnected;
        } catch {
            return false;
        }
    }// Wrapper methods to match component expectations
    
    /**
     * Save wallet address - wrapper around saveWallet
     */
    async saveWalletAddress(wallet: WalletData): Promise<ServiceResponse<boolean>> {
        return this.saveWallet(wallet);
    }

    /**
     * Get wallet addresses - wrapper around loadWallets
     */
    async getWalletAddresses(): Promise<ServiceResponse<WalletData[]>> {
        return this.loadWallets();
    }

    /**
     * Delete wallet address - wrapper around deleteWallet
     */
    async deleteWalletAddress(walletId: string, address: string): Promise<ServiceResponse<boolean>> {
        return this.deleteWallet(walletId, address);
    }
}

export const supabaseMCPWalletService = SupabaseMCPWalletService.getInstance();
