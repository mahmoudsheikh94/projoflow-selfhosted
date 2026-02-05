-- Create licenses table for multi-platform license management
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT UNIQUE NOT NULL,
  purchase_email TEXT NOT NULL,
  purchase_platform TEXT NOT NULL, -- 'gumroad', 'lemonSqueezy', 'stripe', 'appsumo', 'manual', etc.
  purchase_id TEXT, -- External purchase ID from platform
  product_name TEXT DEFAULT 'ProjoFlow Self-Hosted',
  status TEXT DEFAULT 'active', -- 'active', 'revoked', 'expired'
  max_activations INTEGER DEFAULT 999, -- Allow unlimited activations by default
  activation_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}', -- Extra data (purchaser name, notes, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ -- NULL = lifetime license
);

-- Index for fast license key lookups
CREATE INDEX IF NOT EXISTS idx_licenses_license_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_purchase_email ON licenses(purchase_email);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);

-- RLS: Public can validate licenses (read-only for active licenses)
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can validate active licenses"
  ON licenses
  FOR SELECT
  USING (status = 'active');

-- Only service role can insert/update/delete
-- (No policy needed - service role bypasses RLS)

-- Function to generate random license key
CREATE OR REPLACE FUNCTION generate_license_key()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude confusing chars (0, O, I, 1)
  result TEXT := 'PJ-';
  part TEXT;
  i INTEGER;
BEGIN
  -- Generate 3 parts of 6 characters each
  FOR part_num IN 1..3 LOOP
    part := '';
    FOR i IN 1..6 LOOP
      part := part || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    result := result || part;
    IF part_num < 3 THEN
      result := result || '-';
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$;

-- Function to increment activation count
CREATE OR REPLACE FUNCTION increment_license_activation(p_license_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_activations INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Get current activation info
  SELECT max_activations, activation_count
  INTO v_max_activations, v_current_count
  FROM licenses
  WHERE license_key = p_license_key
    AND status = 'active';
  
  -- Check if license exists and is active
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if max activations reached
  IF v_current_count >= v_max_activations THEN
    RETURN FALSE;
  END IF;
  
  -- Increment count
  UPDATE licenses
  SET activation_count = activation_count + 1
  WHERE license_key = p_license_key;
  
  RETURN TRUE;
END;
$$;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION generate_license_key() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION increment_license_activation(TEXT) TO anon, authenticated, service_role;
