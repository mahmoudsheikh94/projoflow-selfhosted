-- ============================================================
-- Invoice System for ProjoFlow
-- ============================================================

-- Add invoice settings to workspace_settings
ALTER TABLE workspace_settings 
ADD COLUMN IF NOT EXISTS invoice_prefix text DEFAULT 'INV-',
ADD COLUMN IF NOT EXISTS invoice_next_number integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS tax_rate numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_label text DEFAULT 'Tax',
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS currency_symbol text DEFAULT '$',
ADD COLUMN IF NOT EXISTS bank_details text,
ADD COLUMN IF NOT EXISTS payment_terms text DEFAULT 'Net 30',
ADD COLUMN IF NOT EXISTS invoice_notes text,
ADD COLUMN IF NOT EXISTS invoice_footer text;

-- Invoice status enum
DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Invoice identification
  invoice_number text NOT NULL,
  status invoice_status DEFAULT 'draft',
  
  -- Dates
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  paid_date date,
  
  -- Amounts (stored in cents/smallest currency unit for precision)
  subtotal integer NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) DEFAULT 0,
  tax_amount integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  
  -- Currency (snapshot at invoice creation)
  currency text DEFAULT 'USD',
  currency_symbol text DEFAULT '$',
  
  -- Additional info
  notes text,
  payment_terms text,
  
  -- PDF storage
  pdf_path text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Item details
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price integer NOT NULL DEFAULT 0, -- in cents
  amount integer NOT NULL DEFAULT 0, -- quantity * unit_price
  
  -- Optional link to time entry
  time_entry_id uuid REFERENCES time_entries(id) ON DELETE SET NULL,
  
  -- Ordering
  sort_order integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_workspace_id ON invoices(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
DROP POLICY IF EXISTS "invoices_select" ON invoices;
CREATE POLICY "invoices_select" ON invoices FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

DROP POLICY IF EXISTS "invoices_insert" ON invoices;
CREATE POLICY "invoices_insert" ON invoices FOR INSERT TO authenticated
  WITH CHECK (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

DROP POLICY IF EXISTS "invoices_update" ON invoices;
CREATE POLICY "invoices_update" ON invoices FOR UPDATE TO authenticated
  USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

DROP POLICY IF EXISTS "invoices_delete" ON invoices;
CREATE POLICY "invoices_delete" ON invoices FOR DELETE TO authenticated
  USING (workspace_id IN (SELECT get_user_workspace_ids(auth.uid())));

DROP POLICY IF EXISTS "invoices_service" ON invoices;
CREATE POLICY "invoices_service" ON invoices FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- RLS Policies for invoice_items
DROP POLICY IF EXISTS "invoice_items_select" ON invoice_items;
CREATE POLICY "invoice_items_select" ON invoice_items FOR SELECT TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "invoice_items_insert" ON invoice_items;
CREATE POLICY "invoice_items_insert" ON invoice_items FOR INSERT TO authenticated
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "invoice_items_update" ON invoice_items;
CREATE POLICY "invoice_items_update" ON invoice_items FOR UPDATE TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "invoice_items_delete" ON invoice_items;
CREATE POLICY "invoice_items_delete" ON invoice_items FOR DELETE TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "invoice_items_service" ON invoice_items;
CREATE POLICY "invoice_items_service" ON invoice_items FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Grants
GRANT ALL ON invoices TO authenticated;
GRANT ALL ON invoices TO service_role;
GRANT ALL ON invoice_items TO authenticated;
GRANT ALL ON invoice_items TO service_role;

-- Function to get next invoice number
CREATE OR REPLACE FUNCTION get_next_invoice_number(ws_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prefix text;
  next_num integer;
  result text;
BEGIN
  -- Get current settings and increment
  UPDATE workspace_settings 
  SET invoice_next_number = invoice_next_number + 1
  WHERE workspace_id = ws_id
  RETURNING invoice_prefix, invoice_next_number - 1 INTO prefix, next_num;
  
  -- If no settings exist, create default
  IF prefix IS NULL THEN
    INSERT INTO workspace_settings (workspace_id, invoice_prefix, invoice_next_number)
    VALUES (ws_id, 'INV-', 2)
    ON CONFLICT (workspace_id) DO UPDATE SET invoice_next_number = workspace_settings.invoice_next_number + 1
    RETURNING invoice_prefix, invoice_next_number - 1 INTO prefix, next_num;
  END IF;
  
  -- Format: INV-0001
  result := prefix || LPAD(next_num::text, 4, '0');
  RETURN result;
END;
$$;
