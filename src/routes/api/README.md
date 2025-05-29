# API Routes Organization

This directory contains all API endpoints organized by feature category for better maintainability.

## Structure

### `/admin` - Administrative Operations
- User management and admin-only features
- **Endpoints:** `delete-user`

### `/crypto` - Cryptocurrency Data
- Price feeds, market data, and crypto-related APIs
- **Endpoints:** `coingecko-price`, `solana-price`, `save-coingecko-list`

### `/wallet` - Wallet & Portfolio Management
- Wallet addresses, balances, and portfolio data
- **Endpoints:** `balances`, `wallet-address`, `save-wallet-balances`, `save-address-overrides`, `save-symbol-overrides`

### `/payments` - Payment Processing
- Payment creation and loan processing
- **Endpoints:** `create-payment`, `loan`

### `/system` - System & Infrastructure
- Debug tools, MCP servers, Redis, SQLite, and system utilities
- **Endpoints:** `debug-stream`, `mcp`, `redis`, `sqlite`, `save-debug-log`, `set-session-cookie`

## Usage

All endpoints maintain their original functionality, just with updated paths:
- Old: `/api/coingecko-price` → New: `/api/crypto/coingecko-price`
- Old: `/api/balances` → New: `/api/wallet/balances`
- etc.
