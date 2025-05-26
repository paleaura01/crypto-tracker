<div align="center">

# 🚀 CryptoTracker
### *Advanced Cryptocurrency Portfolio Management & Real-Time Analytics Platform*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](#license) 
[![SvelteKit](https://img.shields.io/badge/Built%20with-SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)](https://kit.svelte.dev/) 
[![Supabase](https://img.shields.io/badge/Auth-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/) 
[![Solana](https://img.shields.io/badge/Blockchain-Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Ethereum](https://img.shields.io/badge/Ethereum-627EEA?style=for-the-badge&logo=ethereum&logoColor=white)](https://ethereum.org/)

*A comprehensive real-time dashboard and portfolio tracker for your crypto and on-chain assets with AI-powered insights and multi-blockchain support*

[🎯 Features](#-features) • [🛠️ Tech Stack](#️-tech-stack) • [🚀 Quick Start](#-quick-start) • [📊 Dashboard](#-dashboard-preview) • [🤖 AI Integration](#-ai-integration) • [🔧 API](#-api-reference)

</div>

---

## 🌟 **Features**

### 💼 **Portfolio Management**
- **📊 Real-time Portfolio Dashboard** - Live portfolio values with price feeds and interactive historical charts
- **🔗 Multi-Blockchain Support** - Comprehensive tracking across Solana, Ethereum, and ERC-20 tokens
- **💰 Balance Aggregation** - Unified view of assets across multiple wallets and exchanges
- **📈 Performance Analytics** - P&L tracking, ROI calculations, and portfolio performance metrics
- **💎 Asset Discovery** - Automatic token detection and metadata enrichment

### 🔐 **Authentication & Security**
- **🛡️ Secure User Authentication** - Supabase-powered email/password authentication with session management
- **👑 Admin Panel** - Comprehensive user management and elevated privileges system
- **🔒 Server-side Security** - Secure key signing for Coinbase Prime integration
- **📱 Session Management** - HTTP-only cookies for SSR authentication
- **🔑 API Key Protection** - Encrypted storage of sensitive credentials

### 🌐 **Blockchain Integration**
- **🟣 Solana Integration** 
  - Solflare wallet connect & native SOL airdrops
  - SPL token support with real-time balance updates
  - Transaction history and Solana program interactions
- **🔷 Ethereum & EVM Chains**
  - Multi-provider support: Alchemy SDK, Infura, The Graph, Bitquery, BlockCypher
  - ERC-20 token tracking with automatic contract detection
  - Gas fee optimization and transaction monitoring
- **⚡ Real-time Updates** - WebSocket connections for live balance and price updates

### 💳 **Payment & Subscription System**
- **💰 Crypto Payments** - SOL-based subscription payments on Solana blockchain
- **📋 Flexible Plans** - Monthly and lifetime subscription options
- **🔄 Automatic Renewal** - Smart contract-based subscription management
- **📊 Payment Analytics** - Detailed transaction history and payment tracking

### 🎨 **User Experience**
- **🌓 Theme System** - Dark/Light theme with OS preference detection and manual toggle
- **📱 Responsive Design** - Mobile-first design with desktop optimization
- **⚡ Performance Optimized** - SvelteKit's SSR and client-side routing for lightning-fast navigation
- **🎯 Type Safety** - Fully typed with TypeScript and strict ESLint configuration

### 🤖 **AI-Powered Features**
- **🧠 Model Context Protocol (MCP)** - Advanced AI integration for intelligent portfolio insights
- **📸 Desktop Screenshots** - Automated visual monitoring and debugging capabilities
- **🔍 Sequential Thinking** - AI reasoning for complex portfolio decisions
- **💾 Persistent Memory** - AI knowledge management across sessions

---

## 🛠️ **Tech Stack**

<div align="center">

| **Frontend** | **Backend** | **Database** | **Blockchain** | **AI/ML** |
|:---:|:---:|:---:|:---:|:---:|
| ![Svelte](https://img.shields.io/badge/Svelte-FF3E00?style=flat&logo=svelte&logoColor=white) | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white) | ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white) | ![Solana](https://img.shields.io/badge/Solana-9945FF?style=flat&logo=solana&logoColor=white) | ![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white) |
| ![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=flat&logo=svelte&logoColor=white) | ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white) | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat&logo=postgresql&logoColor=white) | ![Ethereum](https://img.shields.io/badge/Ethereum-627EEA?style=flat&logo=ethereum&logoColor=white) | ![Claude](https://img.shields.io/badge/Claude-FF6B35?style=flat&logo=anthropic&logoColor=white) |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat&logo=tailwind-css&logoColor=white) | ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white) | ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white) | ![Alchemy](https://img.shields.io/badge/Alchemy-363FF9?style=flat&logoColor=white) | ![MCP](https://img.shields.io/badge/MCP-4A90E2?style=flat&logoColor=white) |

</div>

### 🎨 **Frontend Architecture**
```typescript
// SvelteKit with TypeScript
Frontend: {
  framework: "SvelteKit",
  styling: "Tailwind CSS",
  language: "TypeScript",
  bundler: "Vite",
  components: "Reusable Svelte Components",
  routing: "File-based Routing",
  ssr: "Server-Side Rendering"
}
```

### ⚡ **Backend Services**
```typescript
// Server-side API layer
Backend: {
  runtime: "Node.js",
  framework: "SvelteKit API Routes", 
  authentication: "Supabase Auth",
  database: "PostgreSQL via Supabase",
  payments: "Solana Web3.js",
  apis: ["Alchemy SDK", "Infura", "The Graph", "Bitquery", "BlockCypher"]
}
```

### 🔗 **Blockchain Integration**
```typescript
// Multi-chain support
Blockchain: {
  solana: "@solana/web3.js + Solflare Wallet",
  ethereum: "Alchemy SDK + Infura",
  indexing: "The Graph Protocol + Bitquery",
  payments: "Native SOL transactions",
  tokens: "SPL + ERC-20 support"
}
```

### 🤖 **AI & Development Tools**
```typescript
// Advanced tooling and AI
Tools: {
  ai: "Model Context Protocol (MCP)",
  memory: "Basic Memory for persistent AI knowledge",
  screenshots: "Desktop screenshot automation",
  thinking: "Sequential AI reasoning",
  coinbase: "Coinbase AgentKit MCP integration"
}
```

| **Layer** | **Technology** | **Purpose** |
|-----------|----------------|-------------|
| **Frontend** | SvelteKit + TypeScript | Reactive UI with SSR/SSG |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Auth & Database** | Supabase (Auth + Postgres) | User management & data persistence |
| **Blockchain APIs** | Alchemy, Infura, The Graph, Bitquery | Multi-chain data aggregation |
| **Crypto Payments** | @solana/web3.js + Solflare | SOL-based subscription system |
| **Prime Trading** | JOSE + TweetNaCl | Secure JWT signing for Coinbase |
| **HTTP Clients** | Fetch API + Axios | RESTful API communication |
| **Build Tools** | Vite + ESLint + Prettier | Development & code quality |
| **AI Integration** | MCP Servers | Intelligent portfolio insights |

---

## 🚀 **Quick Start**

### 📋 **Prerequisites**

```bash
# Required software versions
Node.js >= 18.0.0
npm >= 8.0.0 (or yarn >= 1.22.0)
Git >= 2.30.0
```

**Required Services:**
- **Supabase Project** with Auth enabled (Email/Password)
- **`profiles` table** with `is_admin` boolean column
- **Solana CLI** or Solflare Wallet for testing
- **API Keys** for blockchain providers (Alchemy, Infura, etc.)

### 1️⃣ **Clone & Install**

```bash
# Clone the repository
git clone https://github.com/paleaura01/crypto-tracker.git
cd crypto-tracker

# Install dependencies
npm install
# or with yarn
yarn install

# Install AI/MCP tools
uv tool install basic-memory
npm install -g @modelcontextprotocol/server-filesystem
```

### 2️⃣ **Environment Setup**

```bash
# Copy environment template
cp .env.example .env.local

# Configure your environment variables
nano .env.local
```

**Required Environment Variables:**
```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Blockchain API Keys
ALCHEMY_API_KEY=your_alchemy_api_key
INFURA_PROJECT_ID=your_infura_project_id
THE_GRAPH_API_KEY=your_graph_api_key
BITQUERY_API_KEY=your_bitquery_api_key
BLOCKCYPHER_TOKEN=your_blockcypher_token

# Coinbase Prime (Optional)
COINBASE_PRIME_ACCESS_KEY=your_prime_access_key
COINBASE_PRIME_SECRET_KEY=your_prime_secret_key
COINBASE_PRIME_PASSPHRASE=your_prime_passphrase

# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta

# AI/MCP Configuration (Optional)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Security
SESSION_SECRET=your_random_session_secret
ENCRYPTION_KEY=your_32_character_encryption_key
```

### 3️⃣ **Database Setup**

```bash
# Initialize Supabase locally (if using local development)
npx supabase init
npx supabase start

# Create required tables
npx supabase db reset

# Or use the provided SQL schema
psql -h your-supabase-host -U postgres -d postgres -f supabase/schema.sql
```

**Required Database Schema:**
```sql
-- Create profiles table with admin flag
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  subscription_type TEXT DEFAULT 'free',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet_addresses table
CREATE TABLE wallet_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  address TEXT NOT NULL,
  blockchain TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4️⃣ **MCP Server Configuration**

```bash
# Configure VS Code MCP settings
cp .vscode/mcp.json.example .vscode/mcp.json

# Test MCP servers
uvx basic-memory --project crypto-tracker test
node mcp-servers/coinbase-agentkit-mcp.js --test
```

### 5️⃣ **Development Server**

```bash
# Start development server
npm run dev

# Or with custom port
npm run dev -- --port 3000

# Production build
npm run build
npm run preview
```

🎉 **Open your browser** to the URL shown in terminal (typically [http://localhost:5173](http://localhost:5173))

### 🔧 **Development Tools**

```bash
# Available scripts
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Run Svelte check
npm run check:watch  # Watch mode for type checking
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run test         # Run tests
npm run test:watch   # Watch mode for tests
```

---

## 📊 **Dashboard Preview**

<div align="center">

### 🌟 **Main Portfolio Dashboard**
*Real-time portfolio overview with AI-powered insights and multi-chain support*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🚀 CryptoTracker Dashboard                              💰 $247,521.89     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📈 Portfolio Performance    🔥 Hot Assets      🌐 Multi-Chain    🤖 AI     │
│  ┌─────────────────────────┐ ┌─────────────────┐ ┌──────────────┐ ┌────────┐ │
│  │ Total Value: $247,521   │ │ SOL    +12.4%   │ │ Solana       │ │ 🎯 Buy │ │
│  │ 24h Change: +$8,947     │ │ ETH    +5.8%    │ │ $89,234      │ │ Signal │ │
│  │ P&L: +$47,521 (23.8%)   │ │ MATIC  +18.2%   │ │ Ethereum     │ │ for    │ │
│  │ Best: SOL (+45.2%)      │ │ AVAX   +9.1%    │ │ $125,847     │ │ AVAX   │ │
│  │ Worst: DOGE (-2.1%)     │ │ ADA    +6.7%    │ │ Polygon      │ │ 📊 Re- │ │
│  └─────────────────────────┘ └─────────────────┘ │ $32,441      │ │ balance│ │
│                                                   └──────────────┘ └────────┘ │
│                                                                             │
│  🔗 Connected Wallets                    📋 Recent Transactions             │
│  ┌─────────────────────────────────────┐ ┌─────────────────────────────────┐ │
│  │ ✅ Solflare (Main)                  │ │ ↗️  Bought 2.5 SOL              │ │
│  │ ✅ MetaMask (Trading)               │ │ ↘️  Sold 0.1 ETH                │ │
│  │ ✅ Coinbase (DCA)                   │ │ 🔄 Swapped USDC → SOL            │ │
│  │ ➕ Add New Wallet                   │ │ 💰 Received 15 MATIC             │ │
│  └─────────────────────────────────────┘ └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

</div>

### 📱 **Key Dashboard Features**

| **Component** | **Description** | **Update Frequency** | **AI Enhanced** |
|:--------------|:----------------|:---------------------|:----------------|
| 💰 **Portfolio Value** | Real-time total portfolio worth across all chains | Every 10 seconds | ✅ Trend Analysis |
| 📈 **Performance Chart** | Interactive price history with technical indicators | Live WebSocket | ✅ Pattern Recognition |
| 🔥 **Hot Assets** | Top performing cryptocurrencies with alerts | Every minute | ✅ Sentiment Analysis |
| 🤖 **AI Insights** | Machine learning predictions and recommendations | Every 15 minutes | ✅ Advanced ML Models |
| 🌐 **Multi-Chain View** | Portfolio breakdown by blockchain | Real-time | ✅ Cross-chain Analytics |
| 🚨 **Smart Alerts** | Context-aware notifications for opportunities | Instant | ✅ Predictive Alerts |

### 🔧 **Advanced Dashboard Features**

#### **🎯 Portfolio Analytics**
- **Asset Allocation Pie Chart** - Visual breakdown of portfolio composition
- **Performance Heatmap** - Color-coded performance grid across timeframes
- **Risk Metrics Dashboard** - Volatility, Sharpe ratio, and correlation analysis
- **Historical Performance** - Interactive charts with custom date ranges

#### **💹 **Trading Interface**
- **Quick Trade Panel** - One-click buy/sell with slippage protection
- **Order Book Visualization** - Real-time market depth charts
- **DCA Strategy Manager** - Automated dollar-cost averaging setup
- **Paper Trading Mode** - Risk-free strategy testing environment

#### **🔍 **Market Intelligence**
- **News Feed Integration** - Curated crypto news with sentiment analysis
- **Social Media Sentiment** - Twitter/Reddit sentiment tracking
- **On-chain Metrics** - Whale movements, network activity, and more
- **Technical Analysis** - Built-in indicators and drawing tools

---

## 🤖 **AI Integration**

### 🧠 **Model Context Protocol (MCP) Servers**

Our advanced AI system uses multiple specialized MCP servers for intelligent portfolio management:

```typescript
// MCP Server Configuration
const mcpServers = {
  "basic-memory": {
    purpose: "Persistent AI knowledge and learning",
    capabilities: [
      "portfolio_pattern_recognition",
      "trading_strategy_storage", 
      "market_insight_compilation",
      "user_preference_learning"
    ],
    project: "crypto-tracker"
  },
  "coinbase-agentkit": {
    purpose: "Advanced trading automation and market analysis",
    capabilities: [
      "automated_order_execution",
      "market_sentiment_analysis",
      "price_prediction_models",
      "risk_assessment_algorithms"
    ],
    integration: "coinbase_advanced_trade_api"
  },
  "desktop-screenshot": {
    purpose: "Visual monitoring and debugging",
    capabilities: [
      "portfolio_visual_monitoring",
      "chart_pattern_recognition",
      "ui_regression_testing",
      "automated_screenshot_analysis"
    ]
  },
  "sequential-thinking": {
    purpose: "Multi-step reasoning for complex decisions",
    capabilities: [
      "investment_strategy_planning",
      "risk_scenario_modeling", 
      "market_trend_analysis",
      "portfolio_optimization"
    ]
  }
}
```

### 🎯 **AI-Powered Features**

#### **📊 Portfolio Intelligence**
```typescript
// AI-driven portfolio analysis
interface AIPortfolioInsights {
  riskScore: number;           // 0-100 risk assessment
  diversificationIndex: number; // Portfolio diversification score
  recommendations: TradingRecommendation[];
  marketSentiment: SentimentAnalysis;
  predictedReturns: PredictionModel[];
  optimizationSuggestions: OptimizationTip[];
}
```

#### **🔮 Predictive Analytics**
- **Price Prediction Models** - ML-based price forecasting with confidence intervals
- **Market Sentiment Analysis** - Real-time sentiment from news and social media
- **Volatility Forecasting** - Risk assessment for position sizing
- **Correlation Analysis** - Asset correlation tracking for diversification

#### **🤝 Personalized Recommendations**
- **Investment Strategy Optimization** - AI-tailored strategies based on risk profile
- **Rebalancing Suggestions** - Automated portfolio rebalancing recommendations
- **Tax Optimization** - Tax-loss harvesting and optimization strategies
- **Market Timing Insights** - Entry/exit point recommendations

### 💾 **Persistent AI Memory System**

```markdown
# AI Knowledge Base Structure
## Trading Strategies
- **Successful Patterns**: Historical trades that generated profits
- **Risk Management**: Learned risk tolerance and stop-loss preferences  
- **Market Conditions**: Correlation between market events and portfolio performance
- **User Behavior**: Trading patterns and decision-making tendencies

## Market Intelligence
- **Sector Rotation**: Identification of crypto sector trends
- **Whale Movements**: Large transaction pattern recognition
- **News Impact**: Correlation between news events and price movements
- **Technical Patterns**: Chart pattern recognition and success rates
```

---

## 🏗️ **Project Structure**

```
crypto-tracker/
├── 🎨 src/                           # Source code directory
│   ├── routes/                       # SvelteKit routes (file-based routing)
│   │   ├── +layout.svelte           # Root layout component
│   │   ├── +page.svelte             # Homepage
│   │   ├── dashboard/               # Portfolio dashboard
│   │   │   ├── +page.server.ts      # Server-side data loading
│   │   │   └── +page.svelte         # Dashboard UI components
│   │   ├── portfolio/               # Advanced portfolio analytics
│   │   │   ├── components/          # Portfolio-specific components
│   │   │   └── +page.svelte         # Portfolio analysis page
│   │   ├── admin/                   # Admin panel routes
│   │   │   ├── +layout.server.ts    # Admin auth guard
│   │   │   └── +page.svelte         # User management interface
│   │   ├── auth/                    # Authentication routes
│   │   │   ├── login/               # Login page
│   │   │   ├── signup/              # Registration with SOL payment
│   │   │   ├── callback/            # OAuth callback handler
│   │   │   └── logout/              # Logout endpoint
│   │   └── api/                     # API routes
│   │       ├── balances/            # Wallet balance endpoints
│   │       ├── admin/               # Admin-only API endpoints
│   │       ├── coingecko-price/     # Price data API
│   │       ├── create-payment/      # SOL payment processing
│   │       └── wallet-address/      # Multi-chain address APIs
│   │           ├── alchemy.ts       # Ethereum via Alchemy
│   │           ├── bitquery.ts      # Multi-chain via Bitquery
│   │           ├── blockcypher.ts   # Bitcoin via BlockCypher
│   │           └── graph.ts         # The Graph Protocol
│   ├── lib/                         # Utility libraries and stores
│   │   ├── supabaseClient.ts        # Supabase configuration
│   │   ├── server/                  # Server-side utilities
│   │   │   ├── coinbaseServer.ts    # Coinbase Prime integration
│   │   │   ├── coingeckoServer.ts   # CoinGecko API client
│   │   │   └── supabaseServer.ts    # Server-side Supabase client
│   │   └── stores/                  # Svelte stores for state management
│   │       ├── wallet.ts            # Wallet connection state
│   │       ├── coinbasePrice.ts     # Price data store
│   │       └── admin.ts             # Admin state management
│   ├── data/                        # Static data and configurations
│   │   ├── address-overrides.json   # Custom address mappings
│   │   ├── symbol-overrides.json    # Token symbol overrides
│   │   └── test-wallet-data.json    # Mock data for development
│   ├── hooks.server.ts              # SvelteKit server hooks
│   ├── app.html                     # HTML template
│   ├── app.css                      # Global styles
│   └── app.d.ts                     # TypeScript declarations
├── 🤖 mcp-servers/                   # Model Context Protocol servers
│   ├── desktop-screenshot-mcp.js    # Screenshot automation server
│   └── coinbase-agentkit-mcp.js     # Coinbase trading AI server
├── 📁 static/                        # Static assets
│   └── data/                        # Runtime data storage
│       ├── screenshots/             # Automated screenshots
│       ├── coingecko-list.json      # Cached coin listings
│       └── wallet-balances-*.json   # Cached balance data
├── 🧪 test/                         # Test files
│   ├── complete-setup.js            # Integration tests
│   └── test-structure.js            # Project structure validation
├── 🔧 Configuration Files
│   ├── svelte.config.js             # SvelteKit configuration
│   ├── vite.config.js               # Vite bundler configuration
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   ├── tsconfig.json                # TypeScript configuration
│   ├── eslint.config.mjs            # ESLint rules
│   └── package.json                 # Dependencies and scripts
└── 📚 Documentation
    ├── README.md                    # This file
    ├── MCP-SETUP.md                 # AI/MCP setup guide
    └── .vscode/mcp.json             # VS Code MCP configuration
```

### 🎯 **Key Architecture Patterns**

#### **🔄 Server-Side Rendering (SSR)**
```typescript
// +page.server.ts - Server-side data loading
export async function load({ locals, params }) {
  const { supabase, getSession } = locals;
  const session = await getSession();
  
  // Pre-load portfolio data on server
  const portfolioData = await fetchPortfolioData(session.user.id);
  
  return {
    portfolio: portfolioData,
    user: session.user
  };
}
```

#### **⚡ Reactive State Management**
```typescript
// Svelte stores for reactive data
export const portfolioStore = writable<Portfolio | null>(null);
export const priceStore = writable<PriceData>({});
export const walletStore = writable<WalletConnection | null>(null);

// Real-time price updates
export const initializePriceStream = () => {
  const ws = new WebSocket('wss://api.price-feed.com');
  ws.onmessage = (event) => {
    const priceUpdate = JSON.parse(event.data);
    priceStore.update(prices => ({ ...prices, ...priceUpdate }));
  };
};
```

#### **🌐 Multi-Chain API Abstraction**
```typescript
// Unified interface for different blockchain APIs
interface ChainProvider {
  getBalance(address: string): Promise<TokenBalance[]>;
  getTransactions(address: string): Promise<Transaction[]>;
  getTokenMetadata(address: string): Promise<TokenMetadata>;
}

class AlchemyProvider implements ChainProvider { /* ... */ }
class SolanaProvider implements ChainProvider { /* ... */ }
class BitqueryProvider implements ChainProvider { /* ... */ }
```

---

## 🔧 **API Reference**

### 📊 **Portfolio Endpoints**

#### **GET /api/balances/[address]**
Retrieve wallet balances for a specific address across all supported chains.

```typescript
interface BalanceRequest {
  address: string;
  chains?: string[];  // Optional: filter by specific chains
  refresh?: boolean;  // Force refresh cached data
}

interface BalanceResponse {
  address: string;
  totalValueUsd: number;
  lastUpdated: string;
  balances: {
    [chainId: string]: {
      nativeBalance: TokenBalance;
      tokens: TokenBalance[];
      totalValueUsd: number;
    }
  };
}

// Example usage
const response = await fetch('/api/balances/0xabc...123?chains=ethereum,polygon');
const balances = await response.json();
```

#### **POST /api/save-wallet-balances**
Cache wallet balance data for faster subsequent loads.

```typescript
interface SaveBalancesRequest {
  address: string;
  balances: WalletBalances;
  signature?: string;  // Optional: verify ownership
}
```

### 💰 **Payment Endpoints**

#### **POST /api/create-payment**
Initialize SOL payment for subscription plans.

```typescript
interface PaymentRequest {
  planType: 'monthly' | 'lifetime';
  walletAddress: string;
  amount: number;  // Amount in SOL
}

interface PaymentResponse {
  transactionId: string;
  recipientAddress: string;
  amount: number;
  expiresAt: string;
  verificationRequired: boolean;
}
```

### 📈 **Price Data Endpoints**

#### **GET /api/coingecko-price**
Get current price data for cryptocurrencies.

```typescript
interface PriceRequest {
  ids: string[];      // CoinGecko IDs
  vs_currencies: string[];  // Fiat currencies
  include_24hr_change?: boolean;
}

interface PriceResponse {
  [coinId: string]: {
    [currency: string]: {
      price: number;
      change_24h?: number;
      change_percentage_24h?: number;
      last_updated: string;
    }
  }
}
```

#### **GET /api/solana-price**
Real-time SOL price with advanced metrics.

```typescript
interface SolPriceResponse {
  price_usd: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  volume_24h: number;
  circulating_supply: number;
  last_updated: string;
}
```

### 👑 **Admin Endpoints**

#### **GET /api/admin/users** (Admin Only)
Retrieve user management data.

```typescript
interface AdminUsersResponse {
  users: {
    id: string;
    email: string;
    subscription_type: string;
    subscription_expires_at: string;
    is_admin: boolean;
    created_at: string;
    last_login: string;
  }[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    total_pages: number;
  };
}
```

#### **DELETE /api/admin/delete-user** (Admin Only)
Remove user account and associated data.

```typescript
interface DeleteUserRequest {
  userId: string;
  confirmEmail: string;
  reason?: string;
}
```

### 🔗 **Multi-Chain Wallet APIs**

#### **Ethereum (via Alchemy)**
```typescript
// GET /api/wallet-address/alchemy
interface AlchemyRequest {
  address: string;
  network?: 'mainnet' | 'polygon' | 'arbitrum' | 'optimism';
}
```

#### **Solana**
```typescript
// GET /api/wallet-address/solana
interface SolanaRequest {
  address: string;
  commitment?: 'processed' | 'confirmed' | 'finalized';
}
```

#### **Multi-Chain (via The Graph)**
```typescript
// GET /api/wallet-address/graph
interface GraphRequest {
  address: string;
  protocols?: string[];  // DeFi protocols to query
  networks?: string[];   // Specific networks
}
```

---

## 🔒 **Security & Authentication**

### 🛡️ **Security Architecture**

#### **🔐 Authentication Flow**
```typescript
// Secure authentication with Supabase
interface AuthFlow {
  registration: {
    method: "email_password",
    payment_required: true,
    currency: "SOL",
    verification: "blockchain_transaction"
  },
  session_management: {
    type: "http_only_cookies",
    duration: "24_hours",
    refresh_enabled: true,
    csrf_protection: true
  },
  admin_access: {
    flag_location: "profiles.is_admin",
    endpoint_protection: "/api/admin/*",
    audit_logging: true
  }
}
```

#### **🔑 API Key Management**
```typescript
// Secure API key storage and rotation
class SecureKeyManager {
  async storeApiKey(userId: string, provider: string, key: string) {
    const encrypted = await encrypt(key, process.env.ENCRYPTION_KEY);
    return supabase.from('user_api_keys').upsert({
      user_id: userId,
      provider,
      encrypted_key: encrypted,
      permissions: ['read_only'],  // Never store trading keys
      created_at: new Date().toISOString()
    });
  }
  
  async rotateKey(userId: string, provider: string) {
    // Implement key rotation logic
  }
}
```

### 🚨 **Security Best Practices**

#### **🔒 Data Protection**
- **Encryption at Rest** - All sensitive data encrypted using AES-256
- **API Key Separation** - Read-only keys stored separately from trading keys
- **Session Security** - HTTP-only cookies with SameSite protection
- **CSRF Protection** - Built-in CSRF tokens for state-changing operations

#### **🛡️ Blockchain Security**
```typescript
// Transaction verification
interface TransactionSecurity {
  signature_verification: boolean;
  amount_validation: boolean;
  recipient_verification: boolean;
  replay_attack_protection: boolean;
  timeout_enforcement: boolean;
}

// Example: Verify SOL payment transaction
const verifyPayment = async (signature: string, expectedAmount: number) => {
  const transaction = await connection.getTransaction(signature);
  return {
    isValid: transaction?.meta?.err === null,
    amount: transaction?.meta?.postBalances[1] - transaction?.meta?.preBalances[1],
    recipient: transaction?.transaction.message.accountKeys[1].toString()
  };
};
```

#### **⚡ Rate Limiting & DDoS Protection**
```typescript
// API rate limiting configuration
interface RateLimits {
  authentication: "5 requests/minute",
  portfolio_data: "60 requests/minute", 
  price_updates: "300 requests/minute",
  admin_endpoints: "10 requests/minute",
  payment_creation: "3 requests/5minutes"
}
```

---

## 🧪 **Testing**

### 🔬 **Test Coverage**

```bash
# Run complete test suite
npm run test

# Run specific test categories
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e          # End-to-end tests
npm run test:security     # Security tests

# Test with coverage reports
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### 📊 **Testing Framework**

#### **🧪 Unit Testing**
```typescript
// Example: Portfolio calculation tests
import { describe, it, expect } from 'vitest';
import { calculatePortfolioValue } from '$lib/utils/portfolio';

describe('Portfolio Calculations', () => {
  it('should calculate total portfolio value correctly', () => {
    const balances = [
      { symbol: 'SOL', amount: 10, priceUsd: 100 },
      { symbol: 'ETH', amount: 2, priceUsd: 2000 }
    ];
    
    const total = calculatePortfolioValue(balances);
    expect(total).toBe(5000); // 10*100 + 2*2000
  });
});
```

#### **🔗 Integration Testing**
```typescript
// Example: API endpoint testing
import { describe, it, expect } from 'vitest';
import { GET } from '../src/routes/api/balances/[address]/+server.js';

describe('Balance API', () => {
  it('should return wallet balances', async () => {
    const request = new Request('http://localhost/api/balances/0xtest123');
    const response = await GET({ params: { address: '0xtest123' } });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('totalValueUsd');
  });
});
```

#### **🎭 End-to-End Testing**
```typescript
// Example: Playwright E2E tests
import { test, expect } from '@playwright/test';

test('user can view portfolio dashboard', async ({ page }) => {
  await page.goto('/auth/login');
  await page.fill('[data-testid=email]', 'test@example.com');
  await page.fill('[data-testid=password]', 'password123');
  await page.click('[data-testid=login-button]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid=portfolio-value]')).toBeVisible();
});
```

### 🛡️ **Security Testing**

```typescript
// Security test examples
describe('Security Tests', () => {
  it('should prevent unauthorized admin access', async () => {
    const response = await fetch('/api/admin/users', {
      headers: { Authorization: 'Bearer invalid_token' }
    });
    expect(response.status).toBe(401);
  });
  
  it('should validate SOL payment amounts', () => {
    const payment = { amount: -100 };  // Negative amount
    expect(() => validatePayment(payment)).toThrow('Invalid amount');
  });
});
```

---

## 🚀 **Deployment**

### ☁️ **Deployment Options**

#### **Vercel (Recommended)**
```bash
# Deploy to Vercel
npm install -g vercel
vercel login
vercel link
vercel --prod

# Environment variables setup
vercel env add PUBLIC_SUPABASE_URL
vercel env add PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... add all required environment variables
```

#### **🐳 Docker Deployment**
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "build"]
```

```bash
# Build and run Docker container
docker build -t crypto-tracker .
docker run -p 3000:3000 \
  -e PUBLIC_SUPABASE_URL=$SUPABASE_URL \
  -e PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY \
  crypto-tracker
```

#### **🔧 Self-Hosted with PM2**
```bash
# Install PM2 globally
npm install -g pm2

# Build for production
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# PM2 ecosystem configuration
module.exports = {
  apps: [{
    name: 'crypto-tracker',
    script: 'build/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### 🌐 **CDN & Performance**

```typescript
// Performance optimizations
interface PerformanceConfig {
  caching: {
    static_assets: "1 year",
    api_responses: "5 minutes", 
    price_data: "30 seconds",
    balance_data: "2 minutes"
  },
  compression: {
    brotli: true,
    gzip: true,
    level: 6
  },
  images: {
    format: "webp",
    quality: 80,
    lazy_loading: true
  }
}
```

---

## 📈 **Roadmap**

### 🎯 **Current Sprint (Q2 2025)**
- [x] ✅ Multi-chain portfolio tracking (Solana, Ethereum, Polygon)
- [x] ✅ AI-powered insights with MCP integration
- [x] ✅ SOL-based subscription payments
- [x] ✅ Real-time price feeds and portfolio updates
- [ ] 🔄 Advanced charting tools with technical indicators
- [ ] 🔄 Mobile-responsive dashboard improvements
- [ ] 🔄 DeFi protocol integration (Uniswap, PancakeSwap)

### 🚀 **Upcoming Features (Q3 2025)**
- **📱 Progressive Web App (PWA)** - Offline capability and mobile app experience
- **🔄 Automated Trading Bots** - AI-driven trading strategies and execution
- **📊 Tax Reporting Module** - Automated capital gains calculations and tax reports
- **🌐 Additional Blockchain Support** - Binance Smart Chain, Avalanche, Cardano
- **💼 Institutional Features** - Multi-user accounts, compliance tools, audit trails
- **🎯 Advanced Analytics** - Monte Carlo simulations, risk scenario modeling

### 🌟 **Long-term Vision (Q4 2025 & Beyond)**
- **📱 Native Mobile Apps** - iOS and Android applications with biometric auth
- **🔐 Hardware Wallet Integration** - Ledger, Trezor, and other cold storage support
- **🏦 Banking Integration** - Connect traditional bank accounts for fiat tracking
- **🌍 Global Expansion** - Multi-language support and regional compliance
- **🤝 Social Trading Platform** - Copy trading, leaderboards, and social features
- **🧠 Advanced AI Trading** - Deep learning models for market prediction and execution

### 💡 **Feature Requests & Community**
Vote on upcoming features and submit your ideas:
- **Discord Community** - [Join our Discord](https://discord.gg/crypto-tracker)
- **GitHub Discussions** - [Feature Requests](https://github.com/paleaura01/crypto-tracker/discussions)
- **Roadmap Board** - [Public Roadmap](https://github.com/paleaura01/crypto-tracker/projects)

---

## 🤝 **Contributing**

We welcome contributions from the crypto and development community! Here's how you can help make CryptoTracker even better:

### 🛠️ **Development Process**

1. **🍴 Fork** the repository
2. **🌿 Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **💻 Code** your changes with proper tests
4. **✅ Test** thoroughly (`npm run test && npm run test:e2e`)
5. **📝 Commit** with conventional commits (`git commit -m 'feat: add amazing feature'`)
6. **🚀 Push** to your branch (`git push origin feature/amazing-feature`)
7. **🔄 Open** a Pull Request with detailed description

### 📋 **Contribution Guidelines**

#### **💻 Code Standards**
```bash
# Ensure code quality before committing
npm run lint          # ESLint checks
npm run format        # Prettier formatting
npm run check         # Svelte type checking
npm run test          # Run all tests
```

#### **📝 Commit Convention**
```bash
# Use conventional commits for clear history
feat: add new portfolio analytics dashboard
fix: resolve price calculation bug for multi-chain assets
docs: update API documentation
style: improve responsive design for mobile
test: add integration tests for Solana wallet connection
refactor: optimize balance fetching performance
```

#### **🧪 Testing Requirements**
- **Unit Tests** - All new functions must have unit tests
- **Integration Tests** - API endpoints require integration tests
- **E2E Tests** - User-facing features need end-to-end tests
- **Security Tests** - Authentication and payment flows must be security tested

### 🎯 **Areas We Need Help**

| **Area** | **Skills Needed** | **Difficulty** | **Impact** |
|----------|-------------------|----------------|------------|
| 🎨 **UI/UX Design** | Figma, Design Systems | Medium | High |
| 📱 **Mobile Optimization** | Responsive Design, PWA | Medium | High |
| 🔗 **Blockchain Integration** | Web3, Solidity, Rust | Hard | High |
| 🤖 **AI/ML Features** | Python, TensorFlow, Data Science | Hard | Medium |
| 📖 **Documentation** | Technical Writing | Easy | Medium |
| 🐛 **Bug Fixes** | TypeScript, SvelteKit | Easy-Medium | High |
| 🧪 **Testing** | Playwright, Vitest | Medium | High |
| 🌐 **Internationalization** | i18n, Localization | Medium | Medium |

### 🐛 **Bug Reports**

Found a bug? Please help us fix it by providing:

```markdown
## Bug Report Template

**🐛 Bug Description**
Clear and concise description of the bug

**📝 Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**✅ Expected Behavior**
What should happen

**❌ Actual Behavior**  
What actually happens

**🖥️ Environment**
- OS: [e.g., Windows 11, macOS 13]
- Browser: [e.g., Chrome 118, Firefox 119]
- Node.js Version: [e.g., 18.17.0]
- Package Version: [e.g., 1.2.3]

**📸 Screenshots**
If applicable, add screenshots

**📋 Additional Context**
Any other context about the problem
```

### ✨ **Feature Requests**

Have an idea for a new feature? We'd love to hear it!

```markdown
## Feature Request Template

**🎯 Feature Description**
Clear description of the feature you'd like to see

**💼 Use Case**
Why is this feature needed? What problem does it solve?

**💡 Proposed Solution**
How would you like this feature to work?

**🔄 Alternatives Considered**
Any alternative solutions you've thought about

**📊 Priority**
- [ ] Nice to have
- [ ] Important
- [ ] Critical

**🎨 Mockups/Examples**
If applicable, add mockups or examples
```

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for complete details.

```
MIT License

Copyright (c) 2025 Aaron Deas

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 💬 **Support & Community**

### 🆘 **Get Help**

| **Platform** | **Purpose** | **Response Time** |
|-------------|-------------|-------------------|
| 📚 **[Documentation](https://docs.crypto-tracker.dev)** | Comprehensive guides and API docs | Self-service |
| 💬 **[Discord Community](https://discord.gg/crypto-tracker)** | Real-time chat and community support | < 2 hours |
| 📧 **[Email Support](mailto:support@crypto-tracker.dev)** | Direct technical support | < 24 hours |
| 🐦 **[Twitter](https://twitter.com/CryptoTrackerApp)** | Updates and announcements | Follow for updates |
| 🐛 **[GitHub Issues](https://github.com/paleaura01/crypto-tracker/issues)** | Bug reports and feature requests | < 48 hours |

### 🌟 **Community Resources**

#### **📚 Learning Resources**
- **[Beginner's Guide](https://docs.crypto-tracker.dev/guides/getting-started)** - New to crypto portfolio tracking
- **[API Tutorial](https://docs.crypto-tracker.dev/guides/api-integration)** - Integrate with external services  
- **[AI Integration Guide](https://docs.crypto-tracker.dev/guides/ai-features)** - Leverage AI-powered insights
- **[Self-Hosting Guide](https://docs.crypto-tracker.dev/guides/self-hosting)** - Deploy your own instance

#### **🎥 Video Tutorials**
- **Portfolio Setup** - Complete walkthrough of setting up your first portfolio
- **AI Features Demo** - How to use MCP servers for intelligent insights
- **Multi-Chain Integration** - Adding and managing multiple blockchain wallets
- **Advanced Analytics** - Deep dive into performance metrics and reporting

### 🙏 **Acknowledgments**

Special thanks to the amazing open-source community and the following projects that make CryptoTracker possible:

#### **🚀 Core Technologies**
- **[SvelteKit](https://kit.svelte.dev/)** - The fantastic full-stack framework powering our frontend
- **[Supabase](https://supabase.com/)** - Backend-as-a-service platform for auth and database
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework for beautiful UI
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience

#### **🔗 Blockchain Infrastructure** 
- **[Solana](https://solana.com/)** - High-performance blockchain for payments and DeFi
- **[Ethereum](https://ethereum.org/)** - Decentralized platform for smart contracts
- **[Alchemy](https://www.alchemy.com/)** - Blockchain development platform and APIs
- **[The Graph](https://thegraph.com/)** - Indexing protocol for blockchain data

#### **🤖 AI & Development Tools**
- **[Model Context Protocol](https://modelcontextprotocol.io/)** - Framework for AI integration
- **[Basic Memory](https://basicmachines.co/)** - Persistent AI knowledge management
- **[Coinbase](https://www.coinbase.com/)** - Cryptocurrency exchange and API platform
- **[Vite](https://vitejs.dev/)** - Next-generation frontend tooling

#### **👥 Community Contributors**
- **Early Beta Testers** - Thank you for your feedback and bug reports
- **Community Moderators** - Keeping our Discord and forums helpful and friendly  
- **Code Contributors** - Every PR, no matter how small, makes a difference
- **Documentation Writers** - Helping make the project accessible to everyone

---

<div align="center">

## ⭐ **If this project helps you manage your crypto portfolio, please give it a star!** ⭐

### *Track your crypto. Own your data. Build your wealth.*

**Made with ❤️ by [Aaron Deas](https://github.com/paleaura01) and the open-source community**

[🏠 Live Demo](https://crypto-tracker.vercel.app) • [📖 Documentation](https://docs.crypto-tracker.dev) • [💬 Discord](https://discord.gg/crypto-tracker) • [🐦 Twitter](https://twitter.com/CryptoTrackerApp)

---

### 📊 **Project Stats**

![GitHub stars](https://img.shields.io/github/stars/paleaura01/crypto-tracker?style=social)
![GitHub forks](https://img.shields.io/github/forks/paleaura01/crypto-tracker?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/paleaura01/crypto-tracker?style=social)
![GitHub contributors](https://img.shields.io/github/contributors/paleaura01/crypto-tracker)
![GitHub last commit](https://img.shields.io/github/last-commit/paleaura01/crypto-tracker)
![GitHub repo size](https://img.shields.io/github/repo-size/paleaura01/crypto-tracker)

</div>