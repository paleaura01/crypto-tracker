-- Migration: Add symbol column to token_overrides table
-- This migration adds proper symbol support for symbol overrides
-- to prevent contamination where contract addresses appear as keys in symbolOverrides

-- Add symbol column to store the symbol name for symbol overrides
ALTER TABLE token_overrides 
ADD COLUMN symbol TEXT;

-- Create index for symbol-based lookups
CREATE INDEX IF NOT EXISTS idx_token_overrides_symbol ON token_overrides (user_id, symbol, override_type, is_active) 
WHERE symbol IS NOT NULL;

-- Create index for symbol + wallet lookups
CREATE INDEX IF NOT EXISTS idx_token_overrides_symbol_wallet ON token_overrides (user_id, symbol, wallet_address, override_type, is_active) 
WHERE symbol IS NOT NULL;

-- Replace the global unique constraint with separate constraints for address vs symbol overrides
-- First drop the existing constraint
ALTER TABLE token_overrides 
DROP CONSTRAINT IF EXISTS token_overrides_user_contract_chain_type_wallet_unique;

-- Add constraint for address overrides (using contract_address)
ALTER TABLE token_overrides 
ADD CONSTRAINT token_overrides_address_unique 
UNIQUE (user_id, contract_address, chain, override_type, wallet_address) 
DEFERRABLE INITIALLY DEFERRED;

-- Add constraint for symbol overrides (using symbol) 
ALTER TABLE token_overrides 
ADD CONSTRAINT token_overrides_symbol_unique 
UNIQUE (user_id, symbol, override_type, wallet_address) 
DEFERRABLE INITIALLY DEFERRED;

-- Add a check constraint to ensure symbol overrides have a symbol
ALTER TABLE token_overrides 
ADD CONSTRAINT token_overrides_symbol_check 
CHECK (
  (override_type = 'symbol' AND symbol IS NOT NULL) OR 
  (override_type = 'address' AND symbol IS NULL)
);

-- Create a partial index to enforce the constraint better
CREATE UNIQUE INDEX IF NOT EXISTS idx_token_overrides_enforce_symbol_type 
ON token_overrides (user_id, symbol, override_type, wallet_address) 
WHERE override_type = 'symbol' AND is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_token_overrides_enforce_address_type 
ON token_overrides (user_id, contract_address, chain, override_type, wallet_address) 
WHERE override_type = 'address' AND is_active = true;
