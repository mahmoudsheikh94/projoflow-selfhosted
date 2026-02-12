-- ============================================================
-- Client Credentials System
-- Allows clients to securely share credentials with the agency
-- ============================================================

-- Credential types
DO $$ BEGIN
  CREATE TYPE credential_type AS ENUM ('login', 'api_key', 'oauth', 'ssh', 'database', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Client credentials table
CREATE TABLE IF NOT EXISTS client_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  credential_type credential_type DEFAULT 'other',
  -- Credential fields (stored as-is, encrypt at app level if needed)
  username text,
  password text,
  api_key text,
  url text,
  notes text,
  -- Metadata
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_credentials_client_id ON client_credentials(client_id);

-- Enable RLS
ALTER TABLE client_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admins can do everything
DROP POLICY IF EXISTS "Admins full access to credentials" ON client_credentials;
CREATE POLICY "Admins full access to credentials" ON client_credentials
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt() ->> 'email')
);

-- Client users can view/manage credentials for their client
DROP POLICY IF EXISTS "Client users can view own credentials" ON client_credentials;
CREATE POLICY "Client users can view own credentials" ON client_credentials
FOR SELECT TO authenticated
USING (
  client_id IN (
    SELECT cu.client_id FROM client_users cu WHERE cu.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Client users can insert own credentials" ON client_credentials;
CREATE POLICY "Client users can insert own credentials" ON client_credentials
FOR INSERT TO authenticated
WITH CHECK (
  client_id IN (
    SELECT cu.client_id FROM client_users cu WHERE cu.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Client users can update own credentials" ON client_credentials;
CREATE POLICY "Client users can update own credentials" ON client_credentials
FOR UPDATE TO authenticated
USING (
  client_id IN (
    SELECT cu.client_id FROM client_users cu WHERE cu.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Client users can delete own credentials" ON client_credentials;
CREATE POLICY "Client users can delete own credentials" ON client_credentials
FOR DELETE TO authenticated
USING (
  client_id IN (
    SELECT cu.client_id FROM client_users cu WHERE cu.user_id = auth.uid()
  )
);

-- Grants
GRANT ALL ON client_credentials TO authenticated;
GRANT ALL ON client_credentials TO service_role;

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at ON client_credentials;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON client_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
