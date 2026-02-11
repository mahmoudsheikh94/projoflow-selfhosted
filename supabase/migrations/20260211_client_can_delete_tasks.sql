-- ============================================================
-- Allow client editors to delete tasks they created
-- ============================================================

-- Client editors can delete tasks on their projects
DROP POLICY IF EXISTS "Client editors can delete tasks" ON tasks;
CREATE POLICY "Client editors can delete tasks" ON tasks
FOR DELETE TO authenticated
USING (
  project_id IN (
    SELECT p.id FROM projects p
    JOIN client_users cu ON cu.client_id = p.client_id
    WHERE cu.user_id = auth.uid() AND cu.role = 'editor'
  )
);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
