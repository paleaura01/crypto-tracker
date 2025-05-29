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
}

export interface DebugPanelProps {
  debugInfo: DebugInfo;
  coinListLoading?: boolean;
  coinListError?: string | null;
  balancesLoading?: boolean;
}

// ...existing wallet component types...