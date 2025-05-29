// API request/response type definitions
import type { Portfolio, Wallet, Holding, TokenBalance, Asset } from './portfolio';
import type { Transaction, PriceData, DeFiPosition, NFT, CryptoPrice } from './blockchain';
import type { User, Session } from './auth';
import type { PaginatedResponse, ApiResponse } from './common';

// Portfolio API types
export type GetPortfoliosResponse = ApiResponse<Portfolio[]>;
export type GetPortfolioResponse = ApiResponse<Portfolio>;
export interface CreatePortfolioRequest {
  name: string;
  description?: string;
  is_default?: boolean;
}

// Wallet API types
export type GetWalletsResponse = ApiResponse<Wallet[]>;
export type GetWalletResponse = ApiResponse<Wallet>;
export interface CreateWalletRequest {
  portfolio_id: string;
  name: string;
  address: string;
  chain: string;
  wallet_type: string;
}

export interface WalletBalanceRequest {
  address: string;
  chain: string;
  force_refresh?: boolean;
}

export type WalletBalanceResponse = ApiResponse<{
  address: string;
  chain: string;
  balances: TokenBalance[];
  total_value_usd: number;
  last_updated: string;
}>;

// Holdings API types
export type GetHoldingsResponse = ApiResponse<Holding[]>;
export type GetHoldingResponse = ApiResponse<Holding>;

// Transaction API types
export interface GetTransactionsRequest {
  wallet_id?: string;
  chain?: string;
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
}

export type GetTransactionsResponse = ApiResponse<PaginatedResponse<Transaction>>;

// Price data API types
export interface GetPriceRequest {
  symbols: string[];
  vs_currency?: string;
}

export type GetPriceResponse = ApiResponse<Record<string, PriceData>>;

export interface PriceRequest {
  symbols: string[];
  vs_currency?: string;
  include_market_cap?: boolean;
  include_24hr_vol?: boolean;
  include_24hr_change?: boolean;
}

export type PriceResponse = ApiResponse<Record<string, CryptoPrice>>;

// Portfolio analytics API types
export interface PortfolioAnalytics {
  total_value_usd: number;
  total_cost_basis_usd: number;
  total_pnl_usd: number;
  total_pnl_percent: number;
  allocation: AssetAllocation[];
  performance: PerformanceMetrics;
  top_performers: Holding[];
  worst_performers: Holding[];
}

export interface AssetAllocation {
  symbol: string;
  name: string;
  value_usd: number;
  percentage: number;
  chain: string;
}

export interface PerformanceMetrics {
  daily_change: number;
  weekly_change: number;
  monthly_change: number;
  yearly_change: number;
  all_time_high: number;
  all_time_low: number;
}

export type GetAnalyticsResponse = ApiResponse<PortfolioAnalytics>;

// DeFi positions API types
export interface GetDeFiPositionsRequest {
  wallet_address?: string;
  chain?: string;
  protocol?: string;
}

export type GetDeFiPositionsResponse = ApiResponse<DeFiPosition[]>;

// NFT API types
export interface GetNFTsRequest {
  wallet_address: string;
  chain: string;
  limit?: number;
  cursor?: string;
}

export type GetNFTsResponse = ApiResponse<{
  nfts: NFT[];
  cursor?: string;
  total_count: number;
}>;

// Search API types
export interface SearchRequest {
  query: string;
  type?: 'asset' | 'wallet' | 'transaction' | 'all';
  limit?: number;
}

export type SearchResponse = ApiResponse<{
  assets: Asset[];
  wallets: Wallet[];
  transactions: Transaction[];
}>;

// Auth API types
export interface LoginRequest {
  email: string;
  password: string;
}

export type LoginResponse = ApiResponse<{
  user: User;
  session: Session;
}>;

export interface SignupRequest {
  email: string;
  password: string;
  full_name?: string;
}

export type SignupResponse = ApiResponse<{
  user: User;
  session: Session;
}>;

// WebSocket message types
export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp: number;
}

export type PriceUpdateMessage = WebSocketMessage<{
  symbol: string;
  price: number;
  change_24h: number;
}>;

export type PortfolioUpdateMessage = WebSocketMessage<{
  portfolio_id: string;
  total_value_usd: number;
  change_usd: number;
}>;
