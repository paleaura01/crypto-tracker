// Token balance component types
import type { TokenBalance, BlockchainNetwork } from '../../types/index';

export interface TokenBalanceDisplayProps {
  balance: TokenBalance;
  showValue?: boolean;
  compact?: boolean;
}

export interface TokenListProps {
  tokens: TokenBalance[];
  loading: boolean;
  error?: string;
  onRefresh?: () => void;
}

export interface WalletBalanceProps {
  address: string;
  chain: BlockchainNetwork;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Removed duplicate import and interface
export interface TokenDisplayProps {
  balance: TokenBalance;
  showValue?: boolean;
  compact?: boolean;
}
