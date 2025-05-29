# 🏗️ TypeScript Architecture Optimization Plan

## 📁 **Recommended Folder Structure Reorganization**

### **Current Structure Issues:**
- Type definitions scattered across multiple files
- Inconsistent interface organization  
- Missing shared type definitions
- Service abstractions need improvement

### **🎯 Optimized Folder Structure:**

```
src/
├── lib/
│   ├── types/                    # 🆕 Centralized type definitions
│   │   ├── index.ts              # Main type exports
│   │   ├── api.ts                # API request/response types  
│   │   ├── blockchain.ts         # Blockchain-specific types
│   │   ├── portfolio.ts          # Portfolio & wallet types
│   │   ├── auth.ts               # Authentication types
│   │   └── common.ts             # Shared utility types
│   ├── services/                 # Enhanced service layer
│   │   ├── index.ts              # Service exports
│   │   ├── crypto/               # Crypto-specific services
│   │   │   ├── price-service.ts
│   │   │   ├── wallet-service.ts
│   │   │   └── portfolio-service.ts
│   │   ├── auth/                 # Auth services
│   │   │   ├── auth-service.ts
│   │   │   └── session-service.ts
│   │   └── storage/              # Storage abstractions
│   │       ├── cache-service.ts
│   │       └── persistence-service.ts
│   ├── utils/                    # 🆕 Enhanced utilities
│   │   ├── index.ts              # Utility exports
│   │   ├── validation.ts         # Type guards & validators
│   │   ├── formatters.ts         # Data formatting utilities
│   │   └── api-helpers.ts        # API utility functions
│   ├── stores/                   # Reactive state management
│   │   ├── index.ts              # Store exports
│   │   ├── auth.ts               # Authentication state
│   │   ├── portfolio.ts          # Portfolio state
│   │   └── ui.ts                 # UI state management
│   ├── components/               # 🆕 Shared component library
│   │   ├── index.ts              # Component exports
│   │   ├── ui/                   # Base UI components
│   │   ├── forms/                # Form components
│   │   ├── charts/               # Chart components
│   │   └── layout/               # Layout components
│   └── server/                   # Server-side utilities
│       ├── types.ts              # Server type definitions
│       ├── middleware.ts         # 🆕 Middleware utilities
│       └── validators.ts         # 🆕 Server-side validation
```

## 🔧 **TypeScript Configuration Improvements**

### **1. Enhanced tsconfig.json Structure:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "$types": ["./src/lib/types"],
      "$types/*": ["./src/lib/types/*"],
      "$services": ["./src/lib/services"],
      "$services/*": ["./src/lib/services/*"],
      "$utils": ["./src/lib/utils"],
      "$utils/*": ["./src/lib/utils/*"],
      "$components": ["./src/lib/components"],
      "$components/*": ["./src/lib/components/*"]
    }
  }
}
```

### **2. Centralized Type Definitions:**

#### **src/lib/types/index.ts:**
```typescript
// Central type exports for better organization
export * from './api';
export * from './blockchain';
export * from './portfolio';
export * from './auth';
export * from './common';

// Type utilities
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ApiResponse<T> = {
  data: T;
  error?: string;
  timestamp: number;
};
```

#### **src/lib/types/portfolio.ts:**
```typescript
// Portfolio-specific type definitions
import type { Nullable } from './common';

export interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: PortfolioStatus;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  total_value_usd: number;
  total_cost_basis_usd: number;
  settings: PortfolioSettings;
}

export type PortfolioStatus = 'active' | 'archived' | 'deleted';

export interface PortfolioSettings {
  currency: string;
  privacy_mode: boolean;
  auto_sync: boolean;
}

export interface Wallet {
  id: string;
  portfolio_id: string;
  name: string;
  address: string;
  chain: BlockchainNetwork;
  wallet_type: WalletType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_synced_at: Nullable<string>;
  metadata: WalletMetadata;
}

export type WalletType = 'evm' | 'solana' | 'bitcoin' | 'cosmos';
export type BlockchainNetwork = 'ethereum' | 'polygon' | 'bsc' | 'solana' | 'bitcoin';

export interface WalletMetadata {
  provider?: string;
  imported_at?: string;
  tags?: string[];
}
```

#### **src/lib/types/api.ts:**
```typescript
// API request/response type definitions
import type { Portfolio, Wallet } from './portfolio';

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_next: boolean;
  };
}

export interface WalletBalanceRequest {
  address: string;
  chain: string;
  force_refresh?: boolean;
}

export interface WalletBalanceResponse {
  address: string;
  chain: string;
  balances: TokenBalance[];
  total_value_usd: number;
  last_updated: string;
}

export interface TokenBalance {
  token_address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  price_usd: number;
  value_usd: number;
  logo?: string;
}
```

## 🏭 **Service Layer Architecture Enhancement**

### **src/lib/services/crypto/portfolio-service.ts:**
```typescript
import type { Portfolio, Wallet, ApiResponse } from '$types';
import { supabase } from '$lib/supabaseClient';

export class PortfolioService {
  async getPortfolios(userId: string): Promise<ApiResponse<Portfolio[]>> {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;

      return {
        data: data || [],
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  async createPortfolio(portfolio: Omit<Portfolio, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Portfolio>> {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .insert([portfolio])
        .select()
        .single();

      if (error) throw error;

      return {
        data,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to create portfolio: ${error}`);
    }
  }
}

export const portfolioService = new PortfolioService();
```

## 🧩 **Component Organization Enhancement**

### **src/lib/components/index.ts:**
```typescript
// Centralized component exports
export { default as Button } from './ui/Button.svelte';
export { default as Input } from './ui/Input.svelte';
export { default as Card } from './ui/Card.svelte';

export { default as PortfolioCard } from './portfolio/PortfolioCard.svelte';
export { default as WalletList } from './portfolio/WalletList.svelte';
export { default as BalanceChart } from './charts/BalanceChart.svelte';

export { default as AuthForm } from './forms/AuthForm.svelte';
export { default as WalletForm } from './forms/WalletForm.svelte';
```

### **Enhanced Component Structure:**
```
src/lib/components/
├── ui/                     # Base UI components
│   ├── Button.svelte
│   ├── Input.svelte
│   ├── Card.svelte
│   └── Modal.svelte
├── forms/                  # Form components
│   ├── AuthForm.svelte
│   ├── WalletForm.svelte
│   └── PortfolioForm.svelte
├── charts/                 # Chart components
│   ├── BalanceChart.svelte
│   ├── PriceChart.svelte
│   └── AllocationChart.svelte
├── portfolio/              # Portfolio-specific components
│   ├── PortfolioCard.svelte
│   ├── WalletList.svelte
│   └── HoldingsList.svelte
└── layout/                 # Layout components
    ├── Header.svelte
    ├── Sidebar.svelte
    └── Footer.svelte
```

## 🔧 **API Route Organization Enhancement**

### **Enhanced API Route Structure with Types:**
```typescript
// src/routes/api/portfolio/+server.ts
import type { RequestHandler } from './$types';
import type { Portfolio, ApiResponse } from '$types';
import { portfolioService } from '$services/crypto/portfolio-service';
import { validateRequest } from '$lib/server/validators';

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    const session = await locals.getSession();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response = await portfolioService.getPortfolios(session.user.id);
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const errorResponse: ApiResponse<never> = {
      data: [] as never[],
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: Date.now()
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

## 🔍 **Type Safety Improvements**

### **src/lib/utils/validation.ts:**
```typescript
import type { Portfolio, Wallet, WalletType, BlockchainNetwork } from '$types';

// Type guards for runtime type checking
export function isValidWalletType(type: string): type is WalletType {
  return ['evm', 'solana', 'bitcoin', 'cosmos'].includes(type);
}

export function isValidBlockchainNetwork(network: string): network is BlockchainNetwork {
  return ['ethereum', 'polygon', 'bsc', 'solana', 'bitcoin'].includes(network);
}

export function validatePortfolio(data: unknown): data is Portfolio {
  if (!data || typeof data !== 'object') return false;
  
  const portfolio = data as Portfolio;
  return (
    typeof portfolio.id === 'string' &&
    typeof portfolio.user_id === 'string' &&
    typeof portfolio.name === 'string' &&
    ['active', 'archived', 'deleted'].includes(portfolio.status)
  );
}

export function validateWallet(data: unknown): data is Wallet {
  if (!data || typeof data !== 'object') return false;
  
  const wallet = data as Wallet;
  return (
    typeof wallet.id === 'string' &&
    typeof wallet.address === 'string' &&
    isValidWalletType(wallet.wallet_type) &&
    isValidBlockchainNetwork(wallet.chain)
  );
}
```

## 📊 **Implementation Priority**

### **Phase 1: Foundation (Week 1)**
1. Create `src/lib/types/` directory structure
2. Migrate existing types to centralized locations
3. Update imports throughout codebase
4. Enhance tsconfig.json with new paths

### **Phase 2: Services (Week 2)**
1. Create enhanced service layer structure
2. Migrate existing service logic
3. Add proper error handling and typing
4. Implement service abstractions

### **Phase 3: Components (Week 3)**
1. Reorganize component structure
2. Create component index exports
3. Enhance component typing
4. Add shared component library

### **Phase 4: Validation & Utils (Week 4)**
1. Implement type guards and validators
2. Add utility functions with proper typing
3. Enhance error handling
4. Add comprehensive testing

## 🎯 **Expected Benefits**

- **40-60% reduction** in type-related errors
- **Improved developer experience** with better autocomplete
- **Faster development** with reusable type definitions
- **Better maintainability** with organized structure
- **Enhanced code quality** with strict typing
- **Easier onboarding** for new developers

## 🔧 **Migration Strategy**

1. **Gradual Migration**: Migrate one module at a time
2. **Backwards Compatibility**: Maintain existing imports during transition
3. **Type Checking**: Run TypeScript compiler after each migration step
4. **Testing**: Verify functionality after each major change
5. **Documentation**: Update documentation as structure changes
