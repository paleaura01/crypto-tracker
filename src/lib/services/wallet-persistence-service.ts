// Wallet persistence service for Supabase database integration
import { supabase } from '../supabaseClient.js';
import type { WalletData, OverrideMap } from '../components/types.js';
import { createApiResponse, createErrorResponse } from '../utils/api-helpers.js';

export interface WalletSettings {
  id?: string;
  user_id: string;
  settings_type: 'multi_wallet' | 'global_overrides' | 'individual_wallet';
  settings_data: MultiWalletData | OverrideMap | WalletData;
  created_at?: string;
  updated_at?: string;
}

export interface SavedWalletData {
  id: string;
  address: string;
  label?: string;
  addressOverrides?: OverrideMap;
  symbolOverrides?: OverrideMap;
  expanded?: boolean;
}

export interface MultiWalletData {
  wallets: Array<{
    id: string;
    address: string;
    label: string;
    expanded: boolean;
    addressOverrides: OverrideMap;
    symbolOverrides: OverrideMap;
  }>;
}

export interface GlobalOverridesData {
  addressOverrides: OverrideMap;
  symbolOverrides: OverrideMap;
}

export class WalletPersistenceService {
  private static instance: WalletPersistenceService;

  static getInstance(): WalletPersistenceService {
    if (!WalletPersistenceService.instance) {
      WalletPersistenceService.instance = new WalletPersistenceService();
    }
    return WalletPersistenceService.instance;
  }

  private constructor() {}  /**
   * Get current user from Supabase session
   */
  private async getCurrentUser() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(`Session error: ${error.message}`);
    }
    if (!session || !session.user) {
      throw new Error('User not authenticated');
    }
    return session.user;
  }/**
   * Save multi-wallet configuration to database
   */
  async saveWalletConfiguration(wallets: WalletData[]) {
    try {
      const user = await this.getCurrentUser();
      
      // Prepare wallet data for storage (exclude runtime data)
      const walletSaveData: MultiWalletData = {
        wallets: wallets.map(w => ({
          id: w.id,
          address: w.address,
          label: w.label || '',
          expanded: w.expanded,
          addressOverrides: w.addressOverrides,
          symbolOverrides: w.symbolOverrides
        }))
      };

      const { data, error } = await supabase
        .from('wallet_settings')
        .upsert({
          user_id: user.id,
          settings_type: 'multi_wallet',
          settings_data: walletSaveData
        })
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      return createApiResponse(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save wallet configuration';
      return createErrorResponse(errorMessage);
    }
  }

  /**
   * Load multi-wallet configuration from database
   */
  async loadWalletConfiguration() {
    try {
      const user = await this.getCurrentUser();

      const { data, error } = await supabase
        .from('wallet_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('settings_type', 'multi_wallet')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      // If no data found, return empty configuration
      if (!data) {
        return createApiResponse<MultiWalletData>({ wallets: [] });
      }

      return createApiResponse<MultiWalletData>(data.settings_data);    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load wallet configuration';
      return createErrorResponse(errorMessage);
    }
  }
  /**
   * Save global overrides to database
   */
  async saveGlobalOverrides(addressOverrides: OverrideMap, symbolOverrides: OverrideMap) {
    try {
      const user = await this.getCurrentUser();
      
      const overridesData: GlobalOverridesData = {
        addressOverrides,
        symbolOverrides
      };

      const { data, error } = await supabase
        .from('wallet_settings')
        .upsert({
          user_id: user.id,
          settings_type: 'global_overrides',
          settings_data: overridesData
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return createApiResponse(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save global overrides';
      return createErrorResponse(errorMessage);
    }
  }

  /**
   * Load global overrides from database
   */
  async loadGlobalOverrides() {
    try {
      const user = await this.getCurrentUser();

      const { data, error } = await supabase
        .from('wallet_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('settings_type', 'global_overrides')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      // If no data found, return empty overrides
      if (!data) {
        return createApiResponse<GlobalOverridesData>({ 
          addressOverrides: {}, 
          symbolOverrides: {} 
        });
      }

      return createApiResponse<GlobalOverridesData>(data.settings_data);    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load global overrides';
      return createErrorResponse(errorMessage);
    }
  }

  /**
   * Save token overrides to the existing token_overrides table
   */
  async saveTokenOverride(contractAddress: string, chain: string, overrideType: 'address' | 'symbol', overrideValue: string) {
    try {
      const user = await this.getCurrentUser();

      const { data, error } = await supabase
        .from('token_overrides')
        .upsert({
          user_id: user.id,
          contract_address: contractAddress,
          chain,
          override_type: overrideType,
          override_value: overrideValue
        })
        .select()
        .single();

      if (error) {
        throw error;
      }      return createApiResponse(data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save token override';
      return createErrorResponse(errorMessage);
    }
  }

  /**
   * Load token overrides from the existing token_overrides table
   */
  async loadTokenOverrides() {
    try {
      const user = await this.getCurrentUser();

      const { data, error } = await supabase
        .from('token_overrides')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Convert to override maps
      const addressOverrides: OverrideMap = {};
      const symbolOverrides: OverrideMap = {};

      data?.forEach(override => {
        if (override.override_type === 'address') {
          addressOverrides[override.contract_address] = override.override_value;
        } else if (override.override_type === 'symbol') {
          symbolOverrides[override.contract_address] = override.override_value;
        }
      });      return createApiResponse({
        addressOverrides,
        symbolOverrides
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load token overrides';
      return createErrorResponse(errorMessage);
    }
  }

  /**
   * Delete a token override
   */
  async deleteTokenOverride(contractAddress: string, chain: string, overrideType: 'address' | 'symbol') {
    try {
      const user = await this.getCurrentUser();

      const { error } = await supabase
        .from('token_overrides')
        .delete()
        .eq('user_id', user.id)
        .eq('contract_address', contractAddress)
        .eq('chain', chain)
        .eq('override_type', overrideType);

      if (error) {
        throw error;
      }      return createApiResponse(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete token override';
      return createErrorResponse(errorMessage);
    }
  }

  /**
   * Clear all wallet data for the current user
   */
  async clearAllWalletData() {
    try {
      const user = await this.getCurrentUser();

      // Delete from wallet_settings
      const { error: settingsError } = await supabase
        .from('wallet_settings')
        .delete()
        .eq('user_id', user.id);

      if (settingsError) {
        throw settingsError;
      }

      // Delete from token_overrides
      const { error: overridesError } = await supabase
        .from('token_overrides')
        .delete()
        .eq('user_id', user.id);

      if (overridesError) {
        throw overridesError;
      }      return createApiResponse(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear wallet data';
      return createErrorResponse(errorMessage);
    }
  }

  /**
   * Sync data from localStorage to database (migration helper)
   */
  async migrateFromLocalStorage() {
    try {
      // Storage keys from the original component
      const WALLET_LIST_KEY = 'multi-wallet-list';
      const GLOBAL_ADDR_OVR_KEY = 'globalAddressOverrides';
      const GLOBAL_SYMBOL_OVR_KEY = 'globalSymbolOverrides';

      // Load data from localStorage
      const savedWallets = JSON.parse(localStorage.getItem(WALLET_LIST_KEY) || '[]');
      const globalAddrOverrides = JSON.parse(localStorage.getItem(GLOBAL_ADDR_OVR_KEY) || '{}');
      const globalSymOverrides = JSON.parse(localStorage.getItem(GLOBAL_SYMBOL_OVR_KEY) || '{}');      // Migrate wallet configuration
      if (savedWallets.length > 0) {
        const walletData: WalletData[] = (savedWallets as SavedWalletData[]).map((saved: SavedWalletData) => ({
          id: saved.id,
          address: saved.address || '',
          label: saved.label || '',
          rawOnchain: [],
          portfolio: [],
          loadingBalances: false,
          balancesLoaded: false,
          error: '',
          addressOverrides: saved.addressOverrides || {},
          symbolOverrides: saved.symbolOverrides || {},
          expanded: saved.expanded !== false
        }));

        await this.saveWalletConfiguration(walletData);
      }

      // Migrate global overrides
      if (Object.keys(globalAddrOverrides).length > 0 || Object.keys(globalSymOverrides).length > 0) {
        await this.saveGlobalOverrides(globalAddrOverrides, globalSymOverrides);      }

      return createApiResponse(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to migrate from localStorage';
      return createErrorResponse(errorMessage);
    }
  }

  /**
   * Check if user has any data in the database
   */
  async hasUserData(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('wallet_settings')
        .select('id')
        .eq('user_id', userId)
        .limit(1);      if (error) {
        return false;
      }      return data && data.length > 0;
    } catch {
      return false;
    }
  }
}

export const walletPersistenceService = WalletPersistenceService.getInstance();
