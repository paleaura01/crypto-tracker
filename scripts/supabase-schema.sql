-- Supabase Schema for Crypto Tracker
-- This schema is designed to work with your existing SQLite local storage
-- and provide comprehensive crypto portfolio tracking

-- Enable Row Level Security
ALTER DATABASE postgres SET timezone TO 'UTC';

-- Create custom types
CREATE TYPE transaction_type AS ENUM ('buy', 'sell', 'transfer_in', 'transfer_out', 'swap', 'stake', 'unstake', 'reward', 'fee');
CREATE TYPE portfolio_status AS ENUM ('active', 'archived', 'deleted');
CREATE TYPE price_alert_status AS ENUM ('active', 'triggered', 'disabled');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    preferences JSONB DEFAULT '{}',
    is_premium BOOLEAN DEFAULT FALSE,
    subscription_ends_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ
);

-- Portfolios table
CREATE TABLE IF NOT EXISTS public.portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status portfolio_status DEFAULT 'active',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    total_value_usd DECIMAL(20,8) DEFAULT 0,
    total_cost_basis_usd DECIMAL(20,8) DEFAULT 0,
    settings JSONB DEFAULT '{}'
);

-- Wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    chain VARCHAR(50) NOT NULL, -- 'ethereum', 'bitcoin', 'solana', etc.
    wallet_type VARCHAR(50) DEFAULT 'external', -- 'external', 'exchange', 'hardware'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- Assets table (cryptocurrencies)
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    coingecko_id VARCHAR(255),
    contract_address VARCHAR(255),
    chain VARCHAR(50),
    decimals INTEGER DEFAULT 18,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    market_cap_rank INTEGER,
    UNIQUE(symbol, chain, contract_address)
);

-- Holdings table (current balances)
CREATE TABLE IF NOT EXISTS public.holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
    quantity DECIMAL(30,18) NOT NULL DEFAULT 0,
    average_cost_usd DECIMAL(20,8) DEFAULT 0,
    total_cost_basis_usd DECIMAL(20,8) DEFAULT 0,
    current_price_usd DECIMAL(20,8) DEFAULT 0,
    current_value_usd DECIMAL(20,8) DEFAULT 0,
    unrealized_pnl_usd DECIMAL(20,8) DEFAULT 0,
    unrealized_pnl_percent DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_price_update TIMESTAMPTZ,
    UNIQUE(portfolio_id, wallet_id, asset_id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
    transaction_type transaction_type NOT NULL,
    quantity DECIMAL(30,18) NOT NULL,
    price_usd DECIMAL(20,8),
    fee_usd DECIMAL(20,8) DEFAULT 0,
    total_usd DECIMAL(20,8),
    transaction_hash VARCHAR(255),
    block_number BIGINT,
    transaction_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    notes TEXT
);

-- Price history table (for caching and historical data)
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
    price_usd DECIMAL(20,8) NOT NULL,
    market_cap_usd DECIMAL(30,2),
    volume_24h_usd DECIMAL(30,2),
    price_change_24h_percent DECIMAL(10,4),
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    source VARCHAR(50) DEFAULT 'coingecko',
    UNIQUE(asset_id, timestamp, source)
);

-- Price alerts table
CREATE TABLE IF NOT EXISTS public.price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
    alert_type VARCHAR(20) NOT NULL, -- 'above', 'below', 'change_percent'
    target_price DECIMAL(20,8),
    target_percent DECIMAL(10,4),
    current_price DECIMAL(20,8),
    status price_alert_status DEFAULT 'active',
    triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    notification_settings JSONB DEFAULT '{}'
);

-- Portfolio snapshots (for historical tracking)
CREATE TABLE IF NOT EXISTS public.portfolio_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
    total_value_usd DECIMAL(20,8) NOT NULL,
    total_cost_basis_usd DECIMAL(20,8) NOT NULL,
    unrealized_pnl_usd DECIMAL(20,8) NOT NULL,
    unrealized_pnl_percent DECIMAL(10,4) NOT NULL,
    asset_breakdown JSONB NOT NULL,
    snapshot_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync logs (track data synchronization)
CREATE TABLE IF NOT EXISTS public.sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'prices', 'balances'
    status VARCHAR(20) NOT NULL, -- 'pending', 'running', 'completed', 'failed'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    records_processed INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_status ON public.portfolios(status);
CREATE INDEX IF NOT EXISTS idx_wallets_portfolio_id ON public.wallets(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON public.wallets(address);
CREATE INDEX IF NOT EXISTS idx_wallets_chain ON public.wallets(chain);
CREATE INDEX IF NOT EXISTS idx_assets_symbol ON public.assets(symbol);
CREATE INDEX IF NOT EXISTS idx_assets_coingecko_id ON public.assets(coingecko_id);
CREATE INDEX IF NOT EXISTS idx_assets_contract_address ON public.assets(contract_address);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON public.holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_holdings_wallet_id ON public.holdings(wallet_id);
CREATE INDEX IF NOT EXISTS idx_holdings_asset_id ON public.holdings(asset_id);
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_id ON public.transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_asset_id ON public.transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON public.transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_price_history_asset_id ON public.price_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON public.price_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_asset_id ON public.price_alerts(asset_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_status ON public.price_alerts(status);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_portfolio_id ON public.portfolio_snapshots(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_date ON public.portfolio_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON public.sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON public.sync_logs(status);

-- Row Level Security Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Portfolios policies
CREATE POLICY "Users can view own portfolios" ON public.portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolios" ON public.portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios" ON public.portfolios
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios" ON public.portfolios
    FOR DELETE USING (auth.uid() = user_id);

-- Wallets policies
CREATE POLICY "Users can view own wallets" ON public.wallets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = wallets.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own wallets" ON public.wallets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = wallets.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Holdings policies
CREATE POLICY "Users can view own holdings" ON public.holdings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own holdings" ON public.holdings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = holdings.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = transactions.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own transactions" ON public.transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = transactions.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Price alerts policies
CREATE POLICY "Users can view own price alerts" ON public.price_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own price alerts" ON public.price_alerts
    FOR ALL USING (auth.uid() = user_id);

-- Portfolio snapshots policies
CREATE POLICY "Users can view own portfolio snapshots" ON public.portfolio_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = portfolio_snapshots.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own portfolio snapshots" ON public.portfolio_snapshots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.portfolios 
            WHERE portfolios.id = portfolio_snapshots.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Sync logs policies
CREATE POLICY "Users can view own sync logs" ON public.sync_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sync logs" ON public.sync_logs
    FOR ALL USING (auth.uid() = user_id);

-- Assets and price_history are public (read-only for users)
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assets are viewable by everyone" ON public.assets
    FOR SELECT USING (true);

CREATE POLICY "Price history is viewable by everyone" ON public.price_history
    FOR SELECT USING (true);

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_portfolios
    BEFORE UPDATE ON public.portfolios
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_wallets
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_assets
    BEFORE UPDATE ON public.assets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_holdings
    BEFORE UPDATE ON public.holdings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_transactions
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_price_alerts
    BEFORE UPDATE ON public.price_alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to automatically update portfolio totals
CREATE OR REPLACE FUNCTION public.update_portfolio_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.portfolios SET
        total_value_usd = (
            SELECT COALESCE(SUM(current_value_usd), 0)
            FROM public.holdings
            WHERE portfolio_id = COALESCE(NEW.portfolio_id, OLD.portfolio_id)
        ),
        total_cost_basis_usd = (
            SELECT COALESCE(SUM(total_cost_basis_usd), 0)
            FROM public.holdings
            WHERE portfolio_id = COALESCE(NEW.portfolio_id, OLD.portfolio_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.portfolio_id, OLD.portfolio_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update portfolio totals when holdings change
CREATE TRIGGER update_portfolio_totals_on_holdings_change
    AFTER INSERT OR UPDATE OR DELETE ON public.holdings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_portfolio_totals();

-- Insert some default assets
INSERT INTO public.assets (symbol, name, coingecko_id, chain, decimals) VALUES
    ('BTC', 'Bitcoin', 'bitcoin', 'bitcoin', 8),
    ('ETH', 'Ethereum', 'ethereum', 'ethereum', 18),
    ('SOL', 'Solana', 'solana', 'solana', 9),
    ('USDC', 'USD Coin', 'usd-coin', 'ethereum', 6),
    ('USDT', 'Tether', 'tether', 'ethereum', 6),
    ('BNB', 'BNB', 'binancecoin', 'bsc', 18),
    ('ADA', 'Cardano', 'cardano', 'cardano', 6),
    ('DOT', 'Polkadot', 'polkadot', 'polkadot', 10),
    ('MATIC', 'Polygon', 'matic-network', 'polygon', 18),
    ('AVAX', 'Avalanche', 'avalanche-2', 'avalanche', 18)
ON CONFLICT (symbol, chain, contract_address) DO NOTHING;
