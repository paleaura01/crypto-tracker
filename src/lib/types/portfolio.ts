// Portfolio-specific type definitions
import type { Nullable, UUID, TimestampFields, DecimalString } from './common';

export interface Portfolio extends TimestampFields {
  id: UUID;
  user_id: UUID;
  name: string;
  description?: string;
  status: PortfolioStatus;
  is_default: boolean;
  total_value_usd: number;
  total_cost_basis_usd: number;
  settings: PortfolioSettings;
}

export type PortfolioStatus = 'active' | 'archived' | 'deleted';

export interface PortfolioSettings {
  currency: string;
  privacy_mode: boolean;
  auto_sync: boolean;
  sync_frequency?: 'realtime' | 'hourly' | 'daily' | 'manual';
  risk_tolerance?: 'conservative' | 'moderate' | 'aggressive';
}

export interface Wallet extends TimestampFields {
  id: UUID;
  portfolio_id: UUID;
  name: string;
  address: string;
  chain: BlockchainNetwork;
  wallet_type: WalletType;
  is_active: boolean;
  last_synced_at: Nullable<string>;
  metadata: WalletMetadata;
}

export type WalletType = 'evm' | 'solana' | 'bitcoin' | 'cosmos' | 'exchange' | 'custodial';
export type BlockchainNetwork = 
  | 'ethereum' 
  | 'polygon' 
  | 'bsc' 
  | 'arbitrum'
  | 'optimism'
  | 'solana' 
  | 'bitcoin'
  | 'cosmos'
  | 'avalanche';

// Union type for functions that can accept either string or object form
export type BlockchainNetworkInput = BlockchainNetwork | { id?: string; name?: string; };

export interface WalletMetadata {
  provider?: string;
  imported_at?: string;
  tags?: string[];
  derivation_path?: string;
  public_key?: string;
  is_hardware_wallet?: boolean;
}

export interface Holding extends TimestampFields {
  id: UUID;
  portfolio_id: UUID;
  wallet_id: UUID;
  asset_id: string;
  symbol: string;
  name: string;
  quantity: DecimalString;
  average_cost_usd: number;
  total_cost_basis_usd: number;
  current_price_usd: number;
  current_value_usd: number;
  unrealized_pnl_usd: number;
  unrealized_pnl_percent: number;
  last_price_update?: string;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  chain: BlockchainNetwork;
  contract_address?: string;
  decimals: number;
  logo_url?: string;
  price_usd: number;
  market_cap?: number;
  volume_24h?: number;
  price_change_24h?: number;
  last_updated: string;
}

export interface TokenBalance {
  token_address: string;
  symbol: string;
  name: string;
  balance: DecimalString;
  decimals: number;
  price_usd: number;
  value_usd: number;
  logo_url?: string;
}
