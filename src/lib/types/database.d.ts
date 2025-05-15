/* Raw shapes as returned by Coinbase APIs */

// V2 “advanced trade” accounts return a nested currency object
export interface ExchangeV2Account {
  id: string;
  currency: { code: string; [k: string]: any };
  balance:   { amount: string; currency: string };
  available_balance?: { amount: string; currency: string };
  [k: string]: any;
}

// V3 “brokerage” accounts return a flat currency code and balance.value
export interface ExchangeV3Account {
  id: string;
  currency: string;
  balance:   { value: string; currency: string };
  available_balance?: { value: string; currency: string };
  [k: string]: any;
}

// On-chain wallet accounts mirror V2’s balance.amount
export interface WalletAccount {
  id: string;
  balance: { amount: string; currency: string };
  [k: string]: any;
}

export interface LoanData { /* ... */ }

/* Your Supabase types, if any… */
export interface Database { /* … */ }
