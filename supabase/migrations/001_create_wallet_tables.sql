-- Migration: Complete Supabase schema export via MCP
-- Date: 2025-06-01
-- Description: Creates all tables matching Supabase production schema

-- Create enum types first
CREATE TYPE portfolio_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE price_alert_status AS ENUM ('active', 'triggered', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('buy', 'sell', 'transfer_in', 'transfer_out', 'stake', 'unstake', 'reward', 'fee');

-- Create users table (base table)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    preferences JSONB DEFAULT '{}'::jsonb,
    is_premium BOOLEAN DEFAULT false,
    subscription_ends_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    coinbase_key_json JSONB
);

-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status portfolio_status DEFAULT 'active',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    total_value_usd NUMERIC DEFAULT 0,
    total_cost_basis_usd NUMERIC DEFAULT 0,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Create wallet_addresses table
CREATE TABLE IF NOT EXISTS wallet_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    address TEXT NOT NULL,
    blockchain TEXT NOT NULL DEFAULT 'ethereum',
    label TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create wallet_settings table
CREATE TABLE IF NOT EXISTS wallet_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    settings_type VARCHAR NOT NULL,
    settings_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, settings_type)
);

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    address VARCHAR NOT NULL,
    chain VARCHAR NOT NULL,
    wallet_type VARCHAR DEFAULT 'external',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_synced_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_addresses_user_id ON wallet_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_addresses_address ON wallet_addresses(address);
CREATE INDEX IF NOT EXISTS idx_wallet_addresses_user_address ON wallet_addresses(user_id, address);

CREATE INDEX IF NOT EXISTS idx_wallet_settings_user_id ON wallet_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_settings_type ON wallet_settings(settings_type);

CREATE INDEX IF NOT EXISTS idx_wallets_portfolio_id ON wallets(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to auto-update updated_at
CREATE TRIGGER update_portfolios_updated_at 
    BEFORE UPDATE ON portfolios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_addresses_updated_at 
    BEFORE UPDATE ON wallet_addresses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_settings_updated_at 
    BEFORE UPDATE ON wallet_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at 
    BEFORE UPDATE ON wallets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some test data for development
INSERT INTO portfolios (user_id, name, description, is_default) 
VALUES ('eb0e5944-30a6-4b37-a12e-e3f99dc5db14', 'Default Portfolio', 'Main portfolio for wallet tracking', true)
ON CONFLICT DO NOTHING;

-- Insert test wallet settings
INSERT INTO wallet_settings (user_id, settings_type, settings_data)
VALUES (
    'eb0e5944-30a6-4b37-a12e-e3f99dc5db14', 
    'multi_wallet', 
    '{"wallets":[{"id":"wallet-test-123","label":"Test Wallet","address":"0x1234567890123456789012345678901234567890","expanded":true,"symbolOverrides":{},"addressOverrides":{}}]}'::jsonb
)
ON CONFLICT (user_id, settings_type) 
DO UPDATE SET 
    settings_data = EXCLUDED.settings_data,
    updated_at = now();

-- Insert test wallet address
INSERT INTO wallet_addresses (user_id, address, blockchain, label, is_active)
VALUES (
    'eb0e5944-30a6-4b37-a12e-e3f99dc5db14',
    '0x1234567890123456789012345678901234567890',
    'ethereum',
    'Test Wallet',
    true
)
ON CONFLICT DO NOTHING;