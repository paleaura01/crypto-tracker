/* Shared domain models (Supabase row types + Coinbase DTOs) */

export interface ExchangeV2Account {
	id: string;
	currency: string;
	balance: { value: string; currency: string };
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
	id: string;
	collateral: string;
	loanAmount: string;
	[k: string]: any;
}

/* Example Supabase table types (generated via supabase gen types) */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
	public: {
		Tables: {
			/* add your table definitions or import generated types here */
		};
	};
}
