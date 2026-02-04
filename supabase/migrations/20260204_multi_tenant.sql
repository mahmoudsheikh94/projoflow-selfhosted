-- ============================================================
-- Multi-Tenant Architecture Migration
-- Adds workspaces, workspace_members tables
-- Adds workspace_id to: projects, clients, tasks, time_entries,
--   notes, leads, intake_links, admin_users
-- ============================================================

-- 1. Create workspace member role enum
DO $$ BEGIN
  CREATE TYPE workspace_member_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  owner_id uuid,
  logo_url text,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Create workspace_members table
CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role workspace_member_role NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- 4. Add workspace_id columns (nullable first for backfill)
ALTER TABLE projects      ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE clients       ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE tasks         ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE time_entries  ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE notes         ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE leads         ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE intake_links  ADD COLUMN IF NOT EXISTS workspace_id uuid;
ALTER TABLE admin_users   ADD COLUMN IF NOT EXISTS workspace_id uuid;

-- 5. Create a default workspace for existing data
INSERT INTO workspaces (id, name, slug, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Workspace',
  'default',
  '{"default": true}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- 6. Backfill existing rows with the default workspace
UPDATE projects      SET workspace_id = '00000000-0000-0000-0000-000000000001' WHERE workspace_id IS NULL;
UPDATE clients       SET workspace_id = '00000000-0000-0000-0000-000000000001' WHERE workspace_id IS NULL;
UPDATE tasks         SET workspace_id = '00000000-0000-0000-0000-000000000001' WHERE workspace_id IS NULL;
UPDATE time_entries  SET workspace_id = '00000000-0000-0000-0000-000000000001' WHERE workspace_id IS NULL;
UPDATE notes         SET workspace_id = '00000000-0000-0000-0000-000000000001' WHERE workspace_id IS NULL;
UPDATE leads         SET workspace_id = '00000000-0000-0000-0000-000000000001' WHERE workspace_id IS NULL;
UPDATE intake_links  SET workspace_id = '00000000-0000-0000-0000-000000000001' WHERE workspace_id IS NULL;
UPDATE admin_users   SET workspace_id = '00000000-0000-0000-0000-000000000001' WHERE workspace_id IS NULL;

-- 7. Make workspace_id NOT NULL and add foreign keys
ALTER TABLE projects     ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE projects     ADD CONSTRAINT fk_projects_workspace     FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE clients      ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE clients      ADD CONSTRAINT fk_clients_workspace      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE tasks        ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE tasks        ADD CONSTRAINT fk_tasks_workspace        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE time_entries ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE time_entries ADD CONSTRAINT fk_time_entries_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE notes        ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE notes        ADD CONSTRAINT fk_notes_workspace        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE leads        ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE leads        ADD CONSTRAINT fk_leads_workspace        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE intake_links ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE intake_links ADD CONSTRAINT fk_intake_links_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE admin_users  ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE admin_users  ADD CONSTRAINT fk_admin_users_workspace  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_workspace      ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_clients_workspace       ON clients(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace         ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_workspace  ON time_entries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notes_workspace         ON notes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_workspace         ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_intake_links_workspace  ON intake_links(workspace_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_workspace   ON admin_users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws    ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user  ON workspace_members(user_id);

-- 9. RLS Policies for new tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read workspaces (needed for workspace resolution before full auth)
CREATE POLICY "Anyone can read workspaces"
  ON workspaces FOR SELECT
  USING (true);

-- Owners/admins can update workspaces
CREATE POLICY "Workspace admins can update"
  ON workspaces FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('owner', 'admin')
    )
  );

-- Insert handled by service role during setup (bypasses RLS)

-- Members can view their workspace's members
CREATE POLICY "Members can view workspace members"
  ON workspace_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- Admins/owners can manage workspace members
CREATE POLICY "Admins can insert workspace members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete workspace members"
  ON workspace_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
  );

-- 10. Enable realtime on workspace-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE workspace_members;

COMMENT ON TABLE workspaces IS 'Multi-tenant workspaces. Each customer gets isolated data via workspace_id.';
COMMENT ON TABLE workspace_members IS 'Maps users to workspaces with roles (owner/admin/member).';
