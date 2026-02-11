-- ============================================================
-- Fix: Update tasks_delete policy to include client editors
-- ============================================================

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "tasks_delete" ON tasks;

-- Create new policy that allows both workspace members AND client editors
CREATE POLICY "tasks_delete" ON tasks
FOR DELETE TO authenticated
USING (
  -- Workspace members (admins) can delete
  workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
  OR
  -- Client editors can delete tasks on their projects
  project_id IN (
    SELECT p.id FROM projects p
    JOIN client_users cu ON cu.client_id = p.client_id
    WHERE cu.user_id = auth.uid() AND cu.role = 'editor'
  )
);

-- Also drop my separate policy if it exists (consolidating into one)
DROP POLICY IF EXISTS "Client editors can delete tasks" ON tasks;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
