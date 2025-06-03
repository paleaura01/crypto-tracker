-- 003_adjust_token_overrides_unique.sql
-- Adjust unique constraint to only apply to active overrides

BEGIN;
  -- Drop the existing global unique constraint
  ALTER TABLE token_overrides
  DROP CONSTRAINT IF EXISTS token_overrides_user_id_contract_address_chain_override_typ_key;

  -- Create a partial unique index on active overrides only
  CREATE UNIQUE INDEX IF NOT EXISTS token_overrides_active_unique_idx
    ON token_overrides(user_id, contract_address, chain, override_type)
    WHERE is_active;
COMMIT;
