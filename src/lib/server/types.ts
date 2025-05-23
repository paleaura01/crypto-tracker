// src/lib/server/types.ts

export interface ExchangeV2Account {
  id: string;
  currency: string;
  balance: { value: string; currency: string };
  // mark available_balance optional
  available_balance?: { value: string; currency: string };
  [k: string]: any;
}

export interface ExchangeV3Account {
  id: string;
  currency: string;
  balance: { value: string; currency: string };
  available_balance?: { value: string; currency: string };
  [k: string]: any;
}

export interface WalletAccount {
  id: string;
  balance: { amount: string; currency: string };
  [k: string]: any;
}

export interface LoanData {
  id: string;            // UUID of the loan record
  collateral: number;    // BTC collateral amount
  loanAmount: number;    // USDC borrowed amount
}

/** New: Coinbase custodial wallet account */
export interface CustodialAccount {
  id: string;
  name: string;
  balance: { amount: string; currency: string };
}