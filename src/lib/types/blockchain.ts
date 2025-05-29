// Blockchain and cryptocurrency specific types
import type { DecimalString, UnixTimestamp } from './common';

// Blockchain network definitions
export type SupportedChain = 
  | 'ethereum'
  | 'polygon'
  | 'bsc'
  | 'arbitrum'
  | 'optimism'
  | 'avalanche'
  | 'solana'
  | 'bitcoin'
  | 'cosmos';

export interface ChainConfig {
  id: string;
  name: string;
  symbol: string;
  rpc_url: string;
  explorer_url: string;
  chain_id?: number; // For EVM chains
  decimals: number;
  logo_url?: string;
  is_testnet: boolean;
}

// Transaction types
export interface Transaction {
  hash: string;
  chain: SupportedChain;
  from_address: string;
  to_address: string;
  value: DecimalString;
  gas_used?: DecimalString;
  gas_price?: DecimalString;
  fee: DecimalString;
  block_number: number;
  timestamp: UnixTimestamp;
  status: TransactionStatus;
  type: TransactionType;
}

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';
export type TransactionType = 'send' | 'receive' | 'swap' | 'stake' | 'unstake' | 'contract_interaction';

// Price and market data
export interface PriceData {
  symbol: string;
  price_usd: number;
  price_change_24h: number;
  price_change_7d?: number;
  market_cap?: number;
  volume_24h?: number;
  last_updated: UnixTimestamp;
}

export interface CryptoPrice {
  symbol: string;
  name: string;
  price_usd: number;
  price_change_24h: number;
  price_change_7d?: number;
  price_change_30d?: number;
  market_cap?: number;
  market_cap_rank?: number;
  volume_24h?: number;
  circulating_supply?: number;
  total_supply?: number;
  max_supply?: number;
  last_updated: UnixTimestamp;
}

export interface PriceHistoryEntry {
  symbol: string;
  timestamp: UnixTimestamp;
  price_usd: number;
  volume_24h?: number;
  market_cap?: number;
}

export interface MarketData {
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  volume_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  price_change_percentage_30d: number;
  circulating_supply: number;
  total_supply?: number;
  max_supply?: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

// Gas and fee estimation
export interface GasEstimate {
  chain: SupportedChain;
  gas_limit: DecimalString;
  gas_price: DecimalString;
  estimated_fee_usd: number;
  confidence: 'low' | 'medium' | 'high';
}

// DeFi protocol data
export interface DeFiPosition {
  protocol: string;
  chain: SupportedChain;
  position_type: 'lending' | 'borrowing' | 'liquidity_pool' | 'staking' | 'farming';
  tokens: TokenPosition[];
  total_value_usd: number;
  apy?: number;
  rewards?: RewardToken[];
}

export interface TokenPosition {
  symbol: string;
  amount: DecimalString;
  value_usd: number;
  is_debt?: boolean;
}

export interface RewardToken {
  symbol: string;
  amount: DecimalString;
  value_usd: number;
  claim_available: boolean;
}

// NFT types
export interface NFT {
  contract_address: string;
  token_id: string;
  chain: SupportedChain;
  name: string;
  description?: string;
  image_url?: string;
  collection_name: string;
  estimated_value_usd?: number;
  last_sale_price?: number;
  traits?: NFTTrait[];
}

export interface NFTTrait {
  trait_type: string;
  value: string | number;
  rarity?: number;
}

export interface BlockchainTokenBalance {
  token_address: string;
  symbol: string;
  name?: string;
  balance: string;
  decimals: number;
  value_usd: number;
  logo?: string;
}

export interface BlockchainNetworkConfig {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}
