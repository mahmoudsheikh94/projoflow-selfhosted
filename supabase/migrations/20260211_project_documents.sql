-- ============================================================
-- Project Documents System
-- Allows storing and sharing project-specific documents
-- ============================================================

-- Create storage bucket for project documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Project documents table
CREATE TABLE IF NOT EXISTS project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_by_type text DEFAULT 'admin', -- 'admin' or 'client'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_workspace_id ON project_documents(workspace_id);

-- Enable RLS
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admins can do everything within their workspace
DROP POLICY IF EXISTS "Admins full access to project documents" ON project_documents;
CREATE POLICY "Admins full access to project documents" ON project_documents
FOR ALL TO authenticated
USING (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);

-- Client users can view documents for their projects
DROP POLICY IF EXISTS "Client users can view project documents" ON project_documents;
CREATE POLICY "Client users can view project documents" ON project_documents
FOR SELECT TO authenticated
USING (
  project_id IN (
    SELECT p.id FROM projects p
    JOIN client_users cu ON cu.client_id = p.client_id
    WHERE cu.user_id = auth.uid()
  )
);

-- Client users with editor role can upload documents
DROP POLICY IF EXISTS "Client editors can upload project documents" ON project_documents;
CREATE POLICY "Client editors can upload project documents" ON project_documents
FOR INSERT TO authenticated
WITH CHECK (
  project_id IN (
    SELECT p.id FROM projects p
    JOIN client_users cu ON cu.client_id = p.client_id
    WHERE cu.user_id = auth.uid() AND cu.role = 'editor'
  )
);

-- Client users with editor role can delete their own documents
DROP POLICY IF EXISTS "Client editors can delete own documents" ON project_documents;
CREATE POLICY "Client editors can delete own documents" ON project_documents
FOR DELETE TO authenticated
USING (
  uploaded_by = auth.uid() AND
  project_id IN (
    SELECT p.id FROM projects p
    JOIN client_users cu ON cu.client_id = p.client_id
    WHERE cu.user_id = auth.uid() AND cu.role = 'editor'
  )
);

-- Storage RLS policies
DROP POLICY IF EXISTS "Workspace members can upload project documents" ON storage.objects;
CREATE POLICY "Workspace members can upload project documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM workspaces w
    JOIN workspace_members wm ON wm.workspace_id = w.id
    WHERE wm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Workspace members can view project documents" ON storage.objects;
CREATE POLICY "Workspace members can view project documents" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'project-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM workspaces w
    JOIN workspace_members wm ON wm.workspace_id = w.id
    WHERE wm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Workspace members can delete project documents" ON storage.objects;
CREATE POLICY "Workspace members can delete project documents" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'project-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM workspaces w
    JOIN workspace_members wm ON wm.workspace_id = w.id
    WHERE wm.user_id = auth.uid()
  )
);

-- Client users can view documents in their project folders
DROP POLICY IF EXISTS "Client users can view their project documents" ON storage.objects;
CREATE POLICY "Client users can view their project documents" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'project-documents' AND
  (storage.foldername(name))[2] IN (
    SELECT p.id::text FROM projects p
    JOIN client_users cu ON cu.client_id = p.client_id
    WHERE cu.user_id = auth.uid()
  )
);

-- Grants
GRANT ALL ON project_documents TO authenticated;
GRANT ALL ON project_documents TO service_role;

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at ON project_documents;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON project_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
