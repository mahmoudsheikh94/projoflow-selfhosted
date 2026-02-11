-- ============================================================
-- Allow client users to view workspace members for task assignment
-- ============================================================

-- Client users can view workspace members (for assigning tasks)
DROP POLICY IF EXISTS "Client users can view workspace members" ON workspace_members;
CREATE POLICY "Client users can view workspace members" ON workspace_members
FOR SELECT TO authenticated
USING (
  workspace_id IN (
    SELECT p.workspace_id 
    FROM projects p
    JOIN client_users cu ON cu.client_id = p.client_id
    WHERE cu.user_id = auth.uid()
  )
);

-- Client users can view users table for names/emails (for assignment display)
DROP POLICY IF EXISTS "Client users can view team users" ON users;
CREATE POLICY "Client users can view team users" ON users
FOR SELECT TO authenticated
USING (
  id IN (
    SELECT wm.user_id 
    FROM workspace_members wm
    JOIN projects p ON p.workspace_id = wm.workspace_id
    JOIN client_users cu ON cu.client_id = p.client_id
    WHERE cu.user_id = auth.uid()
  )
  OR
  id = auth.uid()
);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
