-- ============================================================
-- Client Editor Role Permissions
-- Allows client users with 'editor' role to create/edit tasks
-- ============================================================

-- Add 'editor' to client_user_role enum if not exists
DO $$ BEGIN
  ALTER TYPE client_user_role ADD VALUE IF NOT EXISTS 'editor';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow client editors to insert tasks for their projects
DROP POLICY IF EXISTS "Client editors can insert tasks" ON tasks;
CREATE POLICY "Client editors can insert tasks" ON tasks
FOR INSERT TO authenticated
WITH CHECK (
  project_id IN (
    SELECT p.id FROM projects p
    JOIN client_users cu ON cu.client_id = p.client_id
    WHERE cu.user_id = auth.uid() AND cu.role = 'editor'
  )
);

-- Allow client editors to update tasks for their projects
DROP POLICY IF EXISTS "Client editors can update tasks" ON tasks;
CREATE POLICY "Client editors can update tasks" ON tasks
FOR UPDATE TO authenticated
USING (
  project_id IN (
    SELECT p.id FROM projects p
    JOIN client_users cu ON cu.client_id = p.client_id
    WHERE cu.user_id = auth.uid() AND cu.role = 'editor'
  )
)
WITH CHECK (
  project_id IN (
    SELECT p.id FROM projects p
    JOIN client_users cu ON cu.client_id = p.client_id
    WHERE cu.user_id = auth.uid() AND cu.role = 'editor'
  )
);
