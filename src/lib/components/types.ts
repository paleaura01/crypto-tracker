// Component-specific type definitions

// Address Input Component
export interface AddressInputProps {
  address?: string;
  loading?: boolean;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

// Portfolio Display Component
export interface PortfolioItem {
  symbol: string;
  name?: string;
  balance: number;
  price: number;
  value: number;
  contractAddress?: string;
  chain?: string;
  coinGeckoId?: string | null;
  isOverrideExcluded?: boolean; // Whether this token is excluded from pricing via override
  overrideType?: 'symbol' | 'address' | null; // Type of override applied
  hasActiveOverride?: boolean; // Whether this token has a non-null override applied
}

export interface PortfolioDisplayProps {
  portfolio?: PortfolioItem[];
  loading?: boolean;
  error?: string;
  showValues?: boolean;
  sortBy?: 'value' | 'balance' | 'symbol';
  sortDirection?: 'asc' | 'desc';
}

// Override Manager Component
export interface TokenOverride {
  symbol: string;
  coingeckoId: string | null;
}

export interface AddressOverride {
  address: string;
  coingeckoId: string | null;
}

export interface OverrideManagerProps {
  symbolOverrides?: Record<string, string | null>;
  addressOverrides?: Record<string, string | null>;
  availableTokens?: Array<{
    symbol: string;
    contractAddress: string;
    chain: string;
  }>;
  coinList?: Array<{
    id: string;
    symbol: string;
    name: string;
  }>;
  disabled?: boolean;
}

// Raw Data Viewer Component
export interface RawDataViewerProps {
  rawOnchain?: unknown[];
  priceResponse?: unknown;
  coinList?: unknown[];
  loading?: boolean;
  onRefreshBalances?: () => void;
  onRefreshCoinList?: () => void;
}

// Debug Panel Component
export interface DebugEvent {
  timestamp: string;
  type: string;
  message: string;
}

export interface PerformanceMetrics {
  loadTime: number;
  apiCalls: number;
  cacheHits: number;
  cacheAttempts: number;
}

export interface CacheStatus {
  healthy: boolean;
  lastUpdate?: string;
  errors?: string[];
}

export interface DebugInfo {
  refreshDetector: unknown | null;
  streamEvents: DebugEvent[];
  cacheStatus: CacheStatus | null;
  performanceMetrics: PerformanceMetrics | null;
  authStatus?: {
    isAuthenticated: boolean;
    userEmail: string | null;
    hasLocalData: boolean;
    hasDatabaseData: boolean;
  };
}

export interface DebugPanelProps {
  debugInfo: DebugInfo;
  coinListLoading?: boolean;
  coinListError?: string | null;
  balancesLoading?: boolean;
}

// Multi-Wallet Support Types
export interface RawToken {
  symbol: string;
  balance: string;
  contract_address: string;
  chain: 'eth' | 'polygon' | 'bsc';
  token_address: string;
  decimals: number;
}

export interface WalletData {
  id: string;
  address: string;
  label?: string;
  rawOnchain: RawToken[];
  portfolio: PortfolioItem[];
  loadingBalances: boolean;
  balancesLoaded: boolean;
  error: string;
  lastUpdated?: Date;
  addressOverrides: OverrideMap;
  symbolOverrides: OverrideMap;
  expanded: boolean; // UI state for collapsible sections
}

export interface OverrideMap {
  [contractAddress: string]: string | null;
}

export interface CoinListEntry {
  id: string;
  symbol: string;
  name: string;
  platforms?: Record<string, string>;
}

export interface PriceResponse {
  [coinGeckoId: string]: {
    usd: number;
  };
}

export type GlobalPriceResp = PriceResponse | { error: string } | null;

// Multi-Wallet Component Props
export interface MultiWalletHeaderProps {
  totalPortfolioValue: number;
  walletsCount: number;
  chainsCount: number;
  tokensCount: number;
  loadingPrices: boolean;
  onAddWallet: () => void;
  onLoadAllPrices: () => void;
  onShowAdvanced: () => void;
}

export interface WalletSectionProps {
  wallet: WalletData;
  coinList: CoinListEntry[];
  globalPriceResponse: GlobalPriceResp | null;
  onUpdateWallet: (wallet: WalletData) => void;
  onRemoveWallet: (walletId: string) => void;
  onLoadBalances: (walletId: string) => void;
}