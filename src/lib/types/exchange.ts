// Exchange platform specific types
import type { UUID, DecimalString } from './common';

// Coinbase Exchange Types
export interface ExchangeV2Account {
  id: string;
  currency: string;
  balance: { value: string; currency: string };
  available_balance?: { value: string; currency: string };
  [k: string]: unknown;
}

export interface ExchangeV3Account {
  id: string;
  currency: string;
  balance: { value: string; currency: string };
  available_balance?: { value: string; currency: string };
  [k: string]: unknown;
}

export interface WalletAccount {
  id: string;
  balance: { amount: string; currency: string };
  [k: string]: unknown;
}

export interface CustodialAccount {
  id: string;
  name: string;
  balance: { amount: string; currency: string };
}

// Loan/Lending specific types
export interface LoanData {
  id: UUID;
  collateral: number;    // BTC collateral amount
  loanAmount: number;    // USDC borrowed amount
  interestRate?: number;
  dueDate?: string;
  status?: LoanStatus;
}

export type LoanStatus = 'active' | 'repaid' | 'defaulted' | 'liquidated';

// Generic exchange account interface
export interface ExchangeAccount {
  id: string;  exchange: ExchangePlatform;
  currency: string;
  balance: ExchangeBalance;
  available_balance?: ExchangeBalance;
  type: ExchangeAccountType;
  metadata?: Record<string, unknown>;
}

export interface ExchangeBalance {
  value: DecimalString;
  currency: string;
}

export type ExchangePlatform = 
  | 'coinbase'
  | 'binance'
  | 'kraken'
  | 'kucoin'
  | 'bybit'
  | 'okx'
  | 'huobi'
  | 'gate'
  | 'ftx';

export type ExchangeAccountType = 
  | 'spot'
  | 'margin'
  | 'futures'
  | 'savings'
  | 'staking'
  | 'lending';

// Exchange API credentials
export interface ExchangeCredentials {
  platform: ExchangePlatform;
  apiKey: string;
  apiSecret: string;
  passphrase?: string; // For Coinbase Pro
  sandbox?: boolean;
}

// Exchange trading types
export interface ExchangeOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  amount: DecimalString;
  price?: DecimalString;
  status: OrderStatus;
  filled: DecimalString;
  remaining: DecimalString;
  fee?: ExchangeFee;
  timestamp: string;
}

export type OrderStatus = 
  | 'pending'
  | 'open'
  | 'filled'
  | 'partially_filled'
  | 'canceled'
  | 'rejected';

export interface ExchangeFee {
  currency: string;
  amount: DecimalString;
  rate?: number;
}

// Exchange market data
export interface ExchangeTicker {
  symbol: string;
  price: DecimalString;
  bid: DecimalString;
  ask: DecimalString;
  volume: DecimalString;
  change_24h: number;
  timestamp: string;
}
