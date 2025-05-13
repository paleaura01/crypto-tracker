// Shared shapes for Coinbase responses

// Actual Exchange balances (v2)
export interface ExchangeV2Account {
  id: string;
  currency: { code: string; name: string };
  balance:  { amount: string; currency: string };
}

// Advanced Trade balances (v3)
export interface ExchangeV3Account {
  id: string;
  currency: string;
  available_balance: { value: string; currency: string };
  hold_balance:      { value: string; currency: string };
  balance:           { value: string; currency: string };
}

// Placeholder loan summary
export interface LoanSummary {
  /* add fields later */
}
